#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEARNING = join(ROOT, 'skills', 'k12-learning');
const TESTS = join(LEARNING, 'test-prompts.json');
const MAP = join(LEARNING, 'references', 'capability-map.json');
const DECISION_SCHEMA = join(LEARNING, 'schemas', 'playbook-decision.schema.json');
const OUTPUT_SCHEMA = join(ROOT, 'pipeline', 'v3-route-output.schema.json');

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node pipeline/run_v3_route_regression.mjs --contract-only
  node pipeline/run_v3_route_regression.mjs --case <id> [--case <id> ...] [--model gpt-5.6-terra]
  node pipeline/run_v3_route_regression.mjs --all [--limit <n>] [--model gpt-5.6-terra]

The live modes invoke Codex in a read-only ephemeral session for every selected prompt and
compare its full playbook-decision JSON with the checked-in expected route.`);
  process.exit(message ? 2 : 0);
}

const args = process.argv.slice(2);
const options = { all: false, contractOnly: false, cases: [], limit: Infinity, model: null, codex: process.env.CODEX_BIN || 'codex' };
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--all') options.all = true;
  else if (arg === '--contract-only') options.contractOnly = true;
  else if (arg === '--case') options.cases.push(args[++i] || usage('missing --case value'));
  else if (arg === '--limit') options.limit = Number(args[++i]);
  else if (arg === '--model') options.model = args[++i] || usage('missing --model value');
  else if (arg === '--codex-bin') options.codex = args[++i] || usage('missing --codex-bin value');
  else if (arg === '--help' || arg === '-h') usage();
  else usage(`unknown argument: ${arg}`);
}

if (Number.isFinite(options.limit) && (!Number.isInteger(options.limit) || options.limit < 1)) usage('--limit must be a positive integer');
if (!options.contractOnly && !options.all && options.cases.length === 0) usage('choose --contract-only, --all, or at least one --case');
if (options.contractOnly && (options.all || options.cases.length)) usage('--contract-only cannot be combined with live case selection');

const tests = JSON.parse(readFileSync(TESTS, 'utf8'));
const capabilities = JSON.parse(readFileSync(MAP, 'utf8')).capabilities;
const capabilityNames = new Set(capabilities.map(item => item.name));
const routeCases = tests.filter(test => test.expected_route);
const allowedModes = new Set(['DIRECT', 'INTAKE', 'COMPOSE', 'CLARIFY', 'ORDINARY', 'MODULE_REQUIRED']);
const allowedModules = new Set(['llm-wiki', 'k12-automation', 'k12-skill-studio']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateExpected(test) {
  const route = test.expected_route;
  assert(allowedModes.has(route.mode), `${test.id}: invalid expected mode ${route.mode}`);
  const supporting = route.supportingPlaybooks || [];
  assert(Array.isArray(supporting) && supporting.length <= 2, `${test.id}: invalid expected supportingPlaybooks`);
  assert(new Set(supporting).size === supporting.length, `${test.id}: duplicate expected supportingPlaybooks`);
  assert(supporting.every(name => capabilityNames.has(name)), `${test.id}: unknown expected supporting playbook`);
  if (route.mode === 'COMPOSE') {
    assert(capabilityNames.has(route.primaryPlaybook), `${test.id}: unknown expected primary playbook`);
    assert(supporting.length >= 1, `${test.id}: COMPOSE needs an expected supporting playbook`);
  } else {
    assert(supporting.length === 0, `${test.id}: only COMPOSE may expect supporting playbooks`);
  }
  if (['DIRECT', 'INTAKE'].includes(route.mode)) assert(capabilityNames.has(route.primaryPlaybook), `${test.id}: unknown expected primary playbook`);
  if (['CLARIFY', 'ORDINARY', 'MODULE_REQUIRED'].includes(route.mode)) assert((route.primaryPlaybook ?? null) === null, `${test.id}: ${route.mode} primary must be null`);
  if (route.mode === 'MODULE_REQUIRED') assert(allowedModules.has(route.moduleRequired), `${test.id}: invalid required module`);
}

function validateDecision(test, decision) {
  const required = ['mode', 'primaryPlaybook', 'supportingPlaybooks', 'confidence', 'matchedSignals', 'constraints', 'moduleRequired', 'clarification'];
  assert(decision && typeof decision === 'object' && !Array.isArray(decision), `${test.id}: decision must be an object`);
  assert(required.every(key => Object.hasOwn(decision, key)), `${test.id}: decision is missing required fields`);
  assert(Object.keys(decision).every(key => required.includes(key)), `${test.id}: decision contains extra fields`);
  assert(allowedModes.has(decision.mode), `${test.id}: invalid actual mode ${decision.mode}`);
  assert(Array.isArray(decision.supportingPlaybooks) && decision.supportingPlaybooks.length <= 2, `${test.id}: invalid actual supportingPlaybooks`);
  assert(new Set(decision.supportingPlaybooks).size === decision.supportingPlaybooks.length, `${test.id}: duplicate actual supportingPlaybooks`);
  assert(decision.supportingPlaybooks.every(name => capabilityNames.has(name)), `${test.id}: unknown actual supporting playbook`);
  assert(['high', 'medium', 'low'].includes(decision.confidence), `${test.id}: invalid confidence`);
  assert(Array.isArray(decision.matchedSignals) && decision.matchedSignals.length <= 8, `${test.id}: invalid matchedSignals`);
  const constraints = decision.constraints || {};
  for (const key of ['sessionOnly', 'noStateRead', 'noStateWrite', 'noAutomation', 'noSilentInstall']) {
    assert(constraints[key] === true, `${test.id}: ${key} must remain true during routing`);
  }

  const expected = test.expected_route;
  assert(decision.mode === expected.mode, `${test.id}: expected mode ${expected.mode}, got ${decision.mode}`);
  const expectedPrimary = expected.primaryPlaybook ?? null;
  assert(decision.primaryPlaybook === expectedPrimary, `${test.id}: expected primary ${expectedPrimary}, got ${decision.primaryPlaybook}`);
  if (Object.hasOwn(expected, 'moduleRequired')) {
    assert(decision.moduleRequired === expected.moduleRequired, `${test.id}: expected module ${expected.moduleRequired}, got ${decision.moduleRequired}`);
  }
  const expectedSupporting = [...(expected.supportingPlaybooks || [])].sort();
  const actualSupporting = [...decision.supportingPlaybooks].sort();
  assert(JSON.stringify(actualSupporting) === JSON.stringify(expectedSupporting), `${test.id}: expected supporting ${expectedSupporting}, got ${actualSupporting}`);
}

for (const test of routeCases) validateExpected(test);
assert(new Set(routeCases.map(test => test.id)).size === routeCases.length, 'structured route case ids must be unique');
assert(existsSync(DECISION_SCHEMA), `missing decision schema: ${DECISION_SCHEMA}`);
assert(existsSync(OUTPUT_SCHEMA), `missing Codex-compatible output schema: ${OUTPUT_SCHEMA}`);
JSON.parse(readFileSync(OUTPUT_SCHEMA, 'utf8'));

if (options.contractOnly) {
  console.log(`v3 route contract: ${routeCases.length} structured cases; ${capabilityNames.size} capabilities; fixtures valid`);
  process.exit(0);
}

const requested = new Set(options.cases);
for (const id of requested) assert(routeCases.some(test => test.id === id), `unknown structured route case: ${id}`);
const selected = routeCases.filter(test => options.all || requested.has(test.id)).slice(0, options.limit);
assert(selected.length > 0, 'no route cases selected');

let passed = 0;
const failures = [];
for (const test of selected) {
  const runDir = mkdtempSync(join(tmpdir(), 'k12-v3-route-'));
  const output = join(runDir, 'decision.json');
  const prompt = `You are running a K12 routing regression, not answering the student.
Read these local files completely before deciding:
- skills/k12-learning/SKILL.md
- skills/k12-learning/references/routing-policy.md
- skills/k12-learning/references/capability-map.json
- skills/k12-learning/schemas/playbook-decision.schema.json

Route only from the current request below. Do not read Learning State, write files, create reminders,
or execute the learning task. Return exactly one JSON object matching the decision schema. Internal
playbook names are allowed in this regression artifact.

CURRENT REQUEST:
${test.prompt}`;
  const commandArgs = [
    '--ask-for-approval', 'never',
    'exec', '--ephemeral', '--ignore-user-config', '--sandbox', 'read-only', '-C', ROOT,
    '--output-schema', OUTPUT_SCHEMA, '--output-last-message', output,
  ];
  if (options.model) commandArgs.push('--model', options.model);
  commandArgs.push('-');
  const run = spawnSync(options.codex, commandArgs, {
    input: prompt,
    encoding: 'utf8',
    timeout: 240_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  try {
    assert(!run.error, `${test.id}: failed to start ${options.codex}: ${run.error?.message}`);
    assert(run.status === 0, `${test.id}: Codex exited ${run.status}: ${(run.stderr || run.stdout || '').slice(-1200)}`);
    assert(existsSync(output), `${test.id}: Codex did not write a decision`);
    const decision = JSON.parse(readFileSync(output, 'utf8'));
    try {
      validateDecision(test, decision);
    } catch (error) {
      throw new Error(`${error.message}; actual=${JSON.stringify(decision)}`);
    }
    passed += 1;
    console.log(`  [PASS] ${test.id}`);
  } catch (error) {
    failures.push(error.message);
    console.error(`  [FAIL] ${error.message}`);
  } finally {
    rmSync(runDir, { recursive: true, force: true });
  }
}

console.log(`v3 live route regression: ${passed}/${selected.length} passed`);
if (failures.length) process.exit(1);
