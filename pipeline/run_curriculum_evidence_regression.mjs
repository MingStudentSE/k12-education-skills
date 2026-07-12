#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCurriculumEvidence } from '../skills/k12-learning/scripts/resolve-curriculum-evidence.mjs';
import { invocationLifecycle, prepareFixturelessSut, spawnWithSourceReadDenied } from './regression-isolation.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEARNING = join(ROOT, 'skills/k12-learning');
const TESTS = join(LEARNING, 'test-prompts.json');
const CURRICULUM = join(LEARNING, 'references/curriculum/2022');
const OUTPUT_SCHEMA = join(ROOT, 'pipeline/curriculum-evidence-output.schema.json');

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node pipeline/run_curriculum_evidence_regression.mjs --contract-only
  node pipeline/run_curriculum_evidence_regression.mjs --case <id> [--case <id> ...] [--model gpt-5.6-terra]
  node pipeline/run_curriculum_evidence_regression.mjs --all [--limit <n>] [--batch-size <1-10>] [--model gpt-5.6-terra]`);
  process.exit(message ? 2 : 0);
}

const args = process.argv.slice(2);
const options = { all: false, contractOnly: false, cases: [], limit: Infinity, batchSize: 10, model: null, codex: process.env.CODEX_BIN || 'codex' };
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--all') options.all = true;
  else if (arg === '--contract-only') options.contractOnly = true;
  else if (arg === '--case') options.cases.push(args[++i] || usage('missing --case value'));
  else if (arg === '--limit') options.limit = Number(args[++i]);
  else if (arg === '--batch-size') options.batchSize = Number(args[++i]);
  else if (arg === '--model') options.model = args[++i] || usage('missing --model value');
  else if (arg === '--codex-bin') options.codex = args[++i] || usage('missing --codex-bin value');
  else if (arg === '--help' || arg === '-h') usage();
  else usage(`unknown argument: ${arg}`);
}
if (Number.isFinite(options.limit) && (!Number.isInteger(options.limit) || options.limit < 1)) usage('--limit must be a positive integer');
if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 10) usage('--batch-size must be an integer from 1 to 10');
if (!options.contractOnly && !options.all && options.cases.length === 0) usage('choose --contract-only, --all, or at least one --case');
if (options.contractOnly && (options.all || options.cases.length)) usage('--contract-only cannot be combined with live cases');

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tests = JSON.parse(readFileSync(TESTS, 'utf8')).filter(test => test.expected_curriculum_evidence);
const index = JSON.parse(readFileSync(join(CURRICULUM, 'index.json'), 'utf8'));
const models = new Map();
for (const entry of index.profiles) {
  const standards = JSON.parse(readFileSync(join(CURRICULUM, index.officialFacts), 'utf8'));
  const subject = standards.subjects.find(item => item.subjectId === entry.subjectId);
  const candidates = resolveCurriculumEvidence({ routeSubject: entry.routeSubject, grade: subject.gradeRange.min });
  assert(candidates.scopeStatus === 'needs-model-choice', `${entry.routeSubject}: resolver cannot list candidates`);
  for (const candidate of candidates.candidates) {
    const resolved = resolveCurriculumEvidence({ routeSubject: entry.routeSubject, grade: subject.gradeRange.min, modelId: candidate.modelId });
    models.set(candidate.modelId, { ...resolved.selectedModel, subjectId: subject.subjectId, routeSubject: entry.routeSubject, sourceEvidence: resolved.sourceEvidence });
  }
}

function validateExpected(test) {
  const expected = test.expected_curriculum_evidence;
  assert(['applies', 'out-of-scope', 'needs-context', 'unsupported-route'].includes(expected.scopeStatus), `${test.id}: invalid expected scope`);
  assert(expected.firstUseMaxModels === 1 && expected.singleObservationIsMastery === false && expected.stateWriteAllowed === false, `${test.id}: unsafe expected constraints`);
  if (expected.scopeStatus === 'applies') assert(models.has(expected.modelId), `${test.id}: unknown expected model`);
}

function validateActual(test, actual) {
  const expected = test.expected_curriculum_evidence;
  assert(actual.scopeStatus === expected.scopeStatus, `${test.id}: expected scope ${expected.scopeStatus}, got ${actual.scopeStatus}`);
  assert(actual.routeSubject === expected.routeSubject, `${test.id}: expected routeSubject ${expected.routeSubject}, got ${actual.routeSubject}`);
  for (const key of ['sessionOnly', 'noStateWrite', 'noExtraAssessment', 'studentActionRequired']) assert(actual.constraints?.[key] === true, `${test.id}: ${key} must be true`);
  assert(actual.constraints?.singleObservationIsMastery === false, `${test.id}: one observation must not mean mastery`);
  assert(actual.constraints?.maxSelectedModels === 1, `${test.id}: at most one model may be selected`);
  if (Object.hasOwn(expected, 'maxShortActions')) assert(actual.constraints.maxShortActions === expected.maxShortActions, `${test.id}: first-use maxShortActions drifted`);
  if (expected.scopeStatus === 'applies') {
    for (const key of ['standardId', 'subjectId', 'competencyId', 'modelId']) assert(actual[key] === expected[key], `${test.id}: expected ${key}=${expected[key]}, got ${actual[key]}`);
    const model = models.get(actual.modelId);
    assert(JSON.stringify(actual.sourceEvidence) === JSON.stringify(model.sourceEvidence), `${test.id}: official source evidence drifted`);
    assert(actual.observableEvidence.every(item => model.observableEvidence.includes(item)), `${test.id}: observable evidence must be copied from selected model`);
    assert(actual.learningTask?.successCriteria?.length >= 2, `${test.id}: task success criteria missing`);
    for (const key of ['whenMissing', 'whenEmerging', 'whenDemonstrated', 'retest']) assert(actual.feedbackAdjustment?.[key], `${test.id}: feedback ${key} missing`);
  } else {
    for (const key of ['standardId', 'subjectId', 'competencyId', 'modelId']) assert(actual[key] === null, `${test.id}: ${key} must be null outside scope`);
    assert(actual.observableEvidence.length === 0 && actual.learningTask === null && actual.feedbackAdjustment === null, `${test.id}: out-of-scope result must not fabricate an evidence plan`);
    assert(actual.sourceEvidence === null, `${test.id}: out-of-scope result must not claim official source evidence`);
  }
}

for (const test of tests) validateExpected(test);
assert(new Set(tests.map(test => test.id)).size === tests.length, 'curriculum case ids must be unique');
assert(existsSync(OUTPUT_SCHEMA), 'curriculum output schema missing');
JSON.parse(readFileSync(OUTPUT_SCHEMA, 'utf8'));

if (options.contractOnly) {
  console.log(`curriculum evidence contract: ${tests.length} cases; ${index.profiles.length} profiles; ${models.size} models; canonical resolver + fixtures valid`);
  process.exit(0);
}

const requested = new Set(options.cases);
for (const id of requested) assert(tests.some(test => test.id === id), `unknown curriculum case: ${id}`);
const selected = tests.filter(test => options.all || requested.has(test.id)).slice(0, options.limit);
assert(selected.length > 0, 'no curriculum cases selected');

const batches = [];
for (let offset = 0; offset < selected.length; offset += options.batchSize) batches.push(selected.slice(offset, offset + options.batchSize));
console.log(`curriculum evidence live plan: ${selected.length} cases in ${batches.length} Codex invocation(s)`);
const sut = prepareFixturelessSut(ROOT, ['k12-learning']);
process.once('exit', sut.cleanup);

let passed = 0;
const failures = [];
let startedInvocations = 0;
let completedInvocations = 0;
for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
  const batch = batches[batchIndex];
  const runDir = mkdtempSync(join(tmpdir(), 'k12-curriculum-evidence-'));
  const output = join(runDir, 'evidence-plans.json');
  const batchSchema = join(runDir, 'batch-output.schema.json');
  const { $schema: _ignoredSchema, ...planSchema } = JSON.parse(readFileSync(OUTPUT_SCHEMA, 'utf8'));
  writeFileSync(batchSchema, `${JSON.stringify({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    required: ['results'],
    properties: {
      results: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['caseId', 'evidencePlan'],
          properties: {
            caseId: { type: 'string', minLength: 1 },
            evidencePlan: planSchema,
          },
        },
      },
    },
  }, null, 2)}\n`);
  const requests = batch.map(test => ({ caseId: test.id, currentRequest: test.prompt }));
  const prompt = `You are running a K12 curriculum-evidence regression, not answering the student.
Read these files completely before deciding:
- skills/k12-learning/SKILL.md
- skills/k12-learning/references/curriculum-evidence-policy.md
- skills/k12-learning/references/curriculum/2022/index.json
- skills/k12-learning/references/curriculum/2022/standards.json
- skills/k12-learning/scripts/resolve-curriculum-evidence.mjs

For every case independently: if and only if the 2022 compulsory-education scope applies, use the
   canonical resolver for scope and one current-subject model. Copy the resolver's competency-specific
   sourceEvidence exactly, including its exact PDF page. Copy 1-3 observableEvidence strings exactly from that
model, then create a small task and feedback plan grounded in the request. The learningTask must
require a student action; do not pre-complete it. Do not answer the task, read/write Learning State,
create an extra assessment, or claim one observation means mastery. For first-use prompts set
   maxShortActions to 3; otherwise use null. If scope is out-of-scope or unsupported-route, return no
   model and preserve the resolver's version/coverage boundary in scopeNote. Preserve every caseId
   exactly and return one evidencePlan per case.

CASES:
${JSON.stringify(requests, null, 2)}`;
  const commandArgs = [
    '--ask-for-approval', 'never',
    'exec', '--ephemeral', '--ignore-user-config', '--sandbox', 'read-only', '--skip-git-repo-check', '-C', sut.workspaceRoot,
    '--output-schema', batchSchema, '--output-last-message', output,
  ];
  if (options.model) commandArgs.push('--model', options.model);
  commandArgs.push('-');
  const run = spawnWithSourceReadDenied(options.codex, commandArgs, {
    sourceRoot: ROOT,
    workspaceRoot: sut.workspaceRoot,
    input: prompt,
    encoding: 'utf8',
    timeout: 240_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const lifecycle = invocationLifecycle(run);
  if (lifecycle.started) startedInvocations += 1;
  if (lifecycle.completed) completedInvocations += 1;
  try {
    const label = `batch ${batchIndex + 1}/${batches.length}`;
    assert(!run.error, `${label}: failed to start ${options.codex}: ${run.error?.message}`);
    assert(run.status === 0, `${label}: Codex exited ${run.status}: ${(run.stderr || run.stdout || '').slice(-1400)}`);
    assert(existsSync(output), `${label}: Codex did not write evidence plans`);
    const actual = JSON.parse(readFileSync(output, 'utf8'));
    assert(Array.isArray(actual.results) && actual.results.length === batch.length, `${label}: expected ${batch.length} results`);
    const byId = new Map(actual.results.map(item => [item?.caseId, item?.evidencePlan]));
    assert(byId.size === actual.results.length, `${label}: duplicate caseId`);
    for (const test of batch) {
      const plan = byId.get(test.id);
      assert(plan, `${test.id}: missing evidence plan`);
      try { validateActual(test, plan); }
      catch (error) { throw new Error(`${error.message}; actual=${JSON.stringify(plan)}`); }
      passed += 1;
      console.log(`  [PASS] ${test.id}`);
    }
  } catch (error) {
    failures.push(error.message);
    console.error(`  [FAIL] ${error.message}`);
  } finally {
    rmSync(runDir, { recursive: true, force: true });
  }
}

console.log(`curriculum evidence live regression: ${passed}/${selected.length} passed; planned=${batches.length}, started=${startedInvocations}, completed=${completedInvocations}`);
sut.cleanup();
if (failures.length) process.exit(1);
