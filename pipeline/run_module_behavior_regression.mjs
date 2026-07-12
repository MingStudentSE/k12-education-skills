#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import {
  MODULES,
  OUTPUT_SCHEMA,
  RESPONSE_SCHEMA,
  ROOT,
  loadModuleBehaviorFixtures,
  resolveCaseSelectors,
  validateGeneratedBatch,
  validateLiveBatch,
} from './module-behavior-fixtures.mjs';
import { invocationLifecycle, prepareFixturelessSut, spawnWithSourceReadDenied } from './regression-isolation.mjs';

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node pipeline/run_module_behavior_regression.mjs --fixture-only
  node pipeline/run_module_behavior_regression.mjs --case <module:id-or-full-key> [--case ...] [--model gpt-5.6-terra]
  node pipeline/run_module_behavior_regression.mjs --module <name> [--module ...] [--batch-size 20]
  node pipeline/run_module_behavior_regression.mjs --release [--model gpt-5.6-terra] [--report <path>]

--fixture-only (alias --contract-only) validates and normalizes all checked-in fixtures without
calling a model. Live modes use two independent ephemeral contexts per batch: one generator that
cannot see expectations, then one evaluator that sees only frozen responses plus expectations.
The release mode runs every Product Module behavior fixture. Route white-box tests remain a
separate secondary regression. A release also runs:
  node pipeline/run_v3_route_regression.mjs --all --batch-size 40 --model gpt-5.6-terra
  node pipeline/run_curriculum_evidence_regression.mjs --all --batch-size 10 --model gpt-5.6-terra
  node pipeline/verify_curriculum_sources.mjs --live`);
  process.exit(message ? 2 : 0);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const args = process.argv.slice(2);
const options = {
  fixtureOnly: false,
  release: false,
  modules: [],
  cases: [],
  batchSize: 20,
  limitPerModule: Infinity,
  model: process.env.K12_REGRESSION_MODEL || 'gpt-5.6-terra',
  codex: process.env.CODEX_BIN || 'codex',
  report: null,
};
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--fixture-only' || arg === '--contract-only') options.fixtureOnly = true;
  else if (arg === '--release' || arg === '--all') options.release = true;
  else if (arg === '--module') options.modules.push(args[++index] || usage('missing --module value'));
  else if (arg === '--case') options.cases.push(args[++index] || usage('missing --case value'));
  else if (arg === '--batch-size') options.batchSize = Number(args[++index]);
  else if (arg === '--limit-per-module') options.limitPerModule = Number(args[++index]);
  else if (arg === '--model') options.model = args[++index] || usage('missing --model value');
  else if (arg === '--codex-bin') options.codex = args[++index] || usage('missing --codex-bin value');
  else if (arg === '--report') options.report = args[++index] || usage('missing --report value');
  else if (arg === '--help' || arg === '-h') usage();
  else usage(`unknown argument: ${arg}`);
}

if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 40) usage('--batch-size must be an integer from 1 to 40');
if (Number.isFinite(options.limitPerModule) && (!Number.isInteger(options.limitPerModule) || options.limitPerModule < 1)) usage('--limit-per-module must be a positive integer');
if (options.release && Number.isFinite(options.limitPerModule)) usage('--release cannot be combined with --limit-per-module because a release must execute the full corpus');
for (const moduleName of options.modules) if (!MODULES.includes(moduleName)) usage(`unknown module: ${moduleName}`);
if (options.fixtureOnly && (options.release || options.modules.length || options.cases.length || options.report)) usage('--fixture-only cannot be combined with live selection or --report');
if (!options.fixtureOnly && !options.release && options.modules.length === 0 && options.cases.length === 0) usage('choose --fixture-only, --release, --module, or --case');

const fixtures = loadModuleBehaviorFixtures();
const countText = MODULES.map(moduleName => `${moduleName}=${fixtures.behaviorCounts[moduleName]}`).join(', ');
if (options.fixtureOnly) {
  console.log(`module behavior fixture contract: ${fixtures.cases.length} prompt corpus = ${fixtures.behaviorCases.length} executable module-behavior fixtures, including ${fixtures.routeCases.length} overlapping secondary route-white-box fixtures; ${fixtures.assertionCount} module-behavior assertions (${fixtures.safetyAssertionCount} safety); ${fixtures.provenanceCount} source_skill provenance records excluded from runtime; behavior coverage ${countText}; no live model called`);
  process.exit(0);
}

let selected = [];
if (options.release) selected.push(...fixtures.behaviorCases);
if (options.modules.length) selected.push(...fixtures.behaviorCases.filter(item => options.modules.includes(item.module)));
if (options.cases.length) selected.push(...resolveCaseSelectors(fixtures.behaviorCases, options.cases));
selected = [...new Map(selected.map(item => [item.caseKey, item])).values()];
selected = MODULES.flatMap(moduleName => selected
  .filter(item => item.module === moduleName)
  .slice(0, options.limitPerModule));
assert(selected.length > 0, 'no behavior cases selected');

const batches = [];
for (const moduleName of MODULES) {
  const moduleCases = selected.filter(item => item.module === moduleName);
  for (let offset = 0; offset < moduleCases.length; offset += options.batchSize) {
    batches.push(moduleCases.slice(offset, offset + options.batchSize));
  }
}
console.log(`module behavior live plan: ${selected.length} cases in ${batches.length} batches / ${batches.length * 2} Codex invocations; model=${options.model}; batch-size<=${options.batchSize}`);

const sut = prepareFixturelessSut(
  ROOT,
  selected.map(item => item.module),
  [RESPONSE_SCHEMA, OUTPUT_SCHEMA],
);
process.once('exit', sut.cleanup);

function buildGeneratorPrompt(moduleName, batch) {
  const requests = batch.map(item => ({
    caseKey: item.caseKey,
    userRequest: item.prompt,
  }));
  return `You are the system under test in a black-box natural-language regression for one K12 Product Module.

Read skills/${moduleName}/SKILL.md completely. Treat that file as the public module interface and
read only the local references it tells you are necessary for these requests. Do not derive current
behavior from docs/history, migration provenance fields, old Skill names, or source_skill metadata.

For every request below, produce the concise user-visible response that this module should send. This
is a read-only regression: do not write files, create reminders, install dependencies, send data,
or claim a side effect happened. You may explain the exact confirmation or execution step that the
real interface requires. Do not expose internal playbook names unless the user explicitly asks.

You are intentionally not given acceptance criteria. Do not guess or manufacture test verdicts.
Return exactly one JSON object matching the supplied response schema, with exactly one frozen
user-visible response for every caseKey.

MODULE: ${moduleName}
REQUESTS:
${JSON.stringify(requests, null, 2)}`;
}

function buildEvaluatorPrompt(moduleName, batch, generatedByKey) {
  const evaluations = batch.map(item => ({
    caseKey: item.caseKey,
    frozenResponse: generatedByKey.get(item.caseKey).response,
    acceptanceCriteria: item.assertions.map(assertion => ({
      assertionId: assertion.id,
      category: assertion.category,
      criterion: assertion.description,
    })),
  }));
  return `You are an independent regression evaluator. The responses below were frozen by a separate
ephemeral generator that never saw these acceptance criteria. Do not rewrite, improve, or replace
any response. Judge only the supplied text against every criterion.

A passing check must quote a short exact substring of the frozen response as evidence. For a
negative or safety criterion, evidence must quote the sentence that preserves the restriction or
requires confirmation. If the criterion is not demonstrated, set passed=false and evidence=null.

Return exactly one JSON object matching the supplied evaluation schema. Copy each frozenResponse
byte-for-byte into the corresponding response field. Return exactly one result per caseKey and one
check per assertionId.

MODULE: ${moduleName}
EVALUATIONS:
${JSON.stringify(evaluations, null, 2)}`;
}

function invokeCodex(schemaPath, outputPath, prompt) {
  const commandArgs = [
    '--ask-for-approval', 'never',
    'exec', '--ephemeral', '--ignore-user-config', '--sandbox', 'read-only', '--skip-git-repo-check', '-C', sut.workspaceRoot,
    '--output-schema', schemaPath, '--output-last-message', outputPath,
    '--model', options.model, '-',
  ];
  return spawnWithSourceReadDenied(options.codex, commandArgs, {
    sourceRoot: ROOT,
    workspaceRoot: sut.workspaceRoot,
    input: prompt,
    encoding: 'utf8',
    timeout: 600_000,
    maxBuffer: 16 * 1024 * 1024,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  model: options.model,
  selectedCases: selected.length,
  plannedBatches: batches.length,
  plannedInvocations: batches.length * 2,
  generatorIsolation: {
    workspace: 'ephemeral-runtime-copy',
    fixturesPresent: false,
    sourceRepositoryReadDenied: true,
  },
  batches: [],
};
let passedCases = 0;
let startedInvocations = 0;
let completedInvocations = 0;
const failures = [];

function recordInvocation(result) {
  const lifecycle = invocationLifecycle(result);
  if (lifecycle.started) startedInvocations += 1;
  if (lifecycle.completed) completedInvocations += 1;
}

for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
  const batch = batches[batchIndex];
  const moduleName = batch[0].module;
  const runDir = mkdtempSync(join(tmpdir(), 'k12-module-behavior-'));
  const generatedPath = join(runDir, 'generated.json');
  const evaluatedPath = join(runDir, 'evaluated.json');
  const batchLabel = `${moduleName} batch ${batchIndex + 1}/${batches.length} (${batch.length} cases)`;
  let generated = null;
  let evaluated = null;
  process.stdout.write(`  [GENERATE] ${batchLabel}\n`);
  try {
    const generate = invokeCodex(sut.schemaPath(RESPONSE_SCHEMA), generatedPath, buildGeneratorPrompt(moduleName, batch));
    recordInvocation(generate);
    assert(!generate.error, `${batchLabel} generator: failed to start ${options.codex}: ${generate.error?.message}`);
    assert(generate.status === 0, `${batchLabel} generator: Codex exited ${generate.status}: ${(generate.stderr || generate.stdout || '').slice(-1600)}`);
    generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
    const generatedByKey = validateGeneratedBatch(batch, generated);

    process.stdout.write(`  [EVALUATE] ${batchLabel}\n`);
    const evaluate = invokeCodex(sut.schemaPath(OUTPUT_SCHEMA), evaluatedPath, buildEvaluatorPrompt(moduleName, batch, generatedByKey));
    recordInvocation(evaluate);
    assert(!evaluate.error, `${batchLabel} evaluator: failed to start ${options.codex}: ${evaluate.error?.message}`);
    assert(evaluate.status === 0, `${batchLabel} evaluator: Codex exited ${evaluate.status}: ${(evaluate.stderr || evaluate.stdout || '').slice(-1600)}`);
    evaluated = JSON.parse(readFileSync(evaluatedPath, 'utf8'));
    const batchFailures = validateLiveBatch(batch, generatedByKey, evaluated);
    const batchPassedCases = batch.filter(item => !batchFailures.some(failure => failure.startsWith(`${item.caseKey}:`) || failure.startsWith(`${item.caseKey}/`))).length;
    passedCases += batchPassedCases;
    report.batches.push({
      module: moduleName,
      caseKeys: batch.map(item => item.caseKey),
      passed: batchFailures.length === 0,
      passedCases: batchPassedCases,
      failures: batchFailures,
      generator: generated,
      evaluator: evaluated,
    });
    if (batchFailures.length) {
      failures.push(...batchFailures);
      console.error(`  [FAIL] ${batchLabel}: ${batchFailures.length} assertion failures`);
      for (const failure of batchFailures) console.error(`    - ${failure}`);
    } else {
      console.log(`  [PASS] ${batchLabel}`);
    }
  } catch (error) {
    failures.push(error.message);
    report.batches.push({
      module: moduleName,
      caseKeys: batch.map(item => item.caseKey),
      passed: false,
      failures: [error.message],
      generator: generated,
      evaluator: evaluated,
    });
    console.error(`  [FAIL] ${error.message}`);
  } finally {
    rmSync(runDir, { recursive: true, force: true });
  }
}

report.passedCases = passedCases;
report.failureCount = failures.length;
report.startedInvocations = startedInvocations;
report.completedInvocations = completedInvocations;
console.log(`module behavior live regression: ${passedCases}/${selected.length} cases passed; planned=${report.plannedInvocations}, started=${startedInvocations}, completed=${completedInvocations}`);

const releaseSteps = options.release ? [
  {
    name: 'route-white-box',
    args: ['pipeline/run_v3_route_regression.mjs', '--all', '--batch-size', '40', '--model', options.model, '--codex-bin', options.codex],
  },
  {
    name: 'curriculum-evidence',
    args: ['pipeline/run_curriculum_evidence_regression.mjs', '--all', '--batch-size', '10', '--model', options.model, '--codex-bin', options.codex],
  },
  {
    name: 'curriculum-sources',
    args: ['pipeline/verify_curriculum_sources.mjs', '--live'],
  },
] : [];
if (options.release) {
  report.releasePlannedSteps = releaseSteps.map(step => step.name);
  report.releaseSteps = [];
}
if (options.release && failures.length === 0) {
  for (const step of releaseSteps) {
    console.log(`  [RELEASE] ${step.name}`);
    const result = spawnSync(process.execPath, step.args.map((value, index) => index === 0 ? join(ROOT, value) : value), {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 3_600_000,
      maxBuffer: 32 * 1024 * 1024,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const record = {
      name: step.name,
      started: Number.isInteger(result.pid) && result.pid > 0,
      completed: Number.isInteger(result.status),
      exitCode: result.status,
      signal: result.signal,
      error: result.error?.message ?? null,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
    report.releaseSteps.push(record);
    if (result.error || result.status !== 0) {
      failures.push(`${step.name}: ${result.error?.message || `exited ${result.status}`}`);
      break;
    }
  }
}

report.failureCount = failures.length;
if (options.release) {
  report.releaseComplete = failures.length === 0
    && report.releaseSteps.length === releaseSteps.length
    && report.releaseSteps.every(step => step.exitCode === 0);
}
if (options.report) {
  writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`live report: ${options.report}`);
}
sut.cleanup();
if (failures.length) process.exit(1);
