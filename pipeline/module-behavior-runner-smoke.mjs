#!/usr/bin/env node
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-behavior-runner-smoke-'));
const fakeCodex = join(tempRoot, 'fake-codex.mjs');
const phaseLog = join(tempRoot, 'phases.log');
const reportPath = join(tempRoot, 'report.json');
const missingReportPath = join(tempRoot, 'missing-report.json');
const secretCriterion = '应先让学生列核心概念，再标关系词，组织原料、场所、条件、产物、能量转化和影响因素，并用题目或现象回测。';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const fakeSource = `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output-last-message');
const schemaIndex = args.indexOf('--output-schema');
if (outputIndex < 0 || schemaIndex < 0) throw new Error('fake Codex missing output arguments');
const outputPath = args[outputIndex + 1];
const schemaName = basename(args[schemaIndex + 1]);
const input = await new Promise((resolve, reject) => {
  let text = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { text += chunk; });
  process.stdin.on('end', () => resolve(text));
  process.stdin.on('error', reject);
});
const caseKey = input.match(/"caseKey":\\s*"([^"]+)"/)?.[1];
if (!caseKey) throw new Error('fake Codex could not find caseKey');
const frozenResponse = '先列出核心概念，再用关系词连接原料、场所、条件、产物与能量转化；完成后我会用一个现象题和你一起回测。';

if (schemaName === 'module-behavior-response.schema.json') {
  if (existsSync('skills/k12-learning/test-prompts.json')) {
    throw new Error('isolated SUT contains test-prompts.json');
  }
  let sourceDenied = false;
  try {
    readFileSync(process.env.SMOKE_ORIGINAL_FIXTURE, 'utf8');
  } catch (error) {
    sourceDenied = error?.code === 'EPERM' || error?.code === 'EACCES';
  }
  if (!sourceDenied) throw new Error('generator could read the original fixture path');
  if (/acceptanceCriteria|expected-behavior/.test(input) || input.includes(process.env.SMOKE_SECRET)) {
    throw new Error('generator received hidden acceptance criteria');
  }
  if (/frozenResponse/.test(input)) throw new Error('generator received evaluator-only frozenResponse');
  appendFileSync(process.env.SMOKE_STATE, 'generator\\n');
  writeFileSync(outputPath, JSON.stringify({
    module: 'k12-learning',
    results: [{ caseKey, response: frozenResponse }],
  }));
} else if (schemaName === 'module-behavior-output.schema.json') {
  if (!/acceptanceCriteria/.test(input) || !/frozenResponse/.test(input) || !input.includes(process.env.SMOKE_SECRET)) {
    throw new Error('evaluator did not receive frozen response plus acceptance criteria');
  }
  appendFileSync(process.env.SMOKE_STATE, 'evaluator\\n');
  writeFileSync(outputPath, JSON.stringify({
    module: 'k12-learning',
    results: [{
      caseKey,
      response: frozenResponse,
      checks: [{ assertionId: 'expected-behavior', passed: true, evidence: '先列出核心概念' }],
    }],
  }));
} else {
  throw new Error(\`unexpected schema: \${schemaName}\`);
}
`;

try {
  writeFileSync(fakeCodex, fakeSource, 'utf8');
  chmodSync(fakeCodex, 0o755);
  const run = spawnSync(process.execPath, [
    join(ROOT, 'pipeline/run_module_behavior_regression.mjs'),
    '--case', 'k12-learning:concept-map',
    '--codex-bin', fakeCodex,
    '--model', 'deterministic-smoke',
    '--report', reportPath,
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      SMOKE_STATE: phaseLog,
      SMOKE_SECRET: secretCriterion,
      SMOKE_ORIGINAL_FIXTURE: join(ROOT, 'skills/k12-learning/test-prompts.json'),
    },
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert(run.status === 0, `runner smoke failed: ${run.stderr || run.stdout}`);
  assert(readFileSync(phaseLog, 'utf8') === 'generator\nevaluator\n', 'runner did not use isolated generator then evaluator phases');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert(report.selectedCases === 1 && report.plannedInvocations === 2 && report.startedInvocations === 2 && report.completedInvocations === 2, 'runner report has dishonest case/invocation lifecycle counts');
  assert(report.passedCases === 1 && report.failureCount === 0, 'runner report did not record deterministic pass');
  assert(report.batches?.[0]?.generator && report.batches?.[0]?.evaluator, 'runner report did not preserve separate generator/evaluator artifacts');

  const missing = spawnSync(process.execPath, [
    join(ROOT, 'pipeline/run_module_behavior_regression.mjs'),
    '--case', 'k12-learning:concept-map',
    '--codex-bin', join(tempRoot, 'does-not-exist'),
    '--model', 'deterministic-smoke',
    '--report', missingReportPath,
  ], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  assert(missing.status === 1, 'missing Codex executable must fail the runner');
  const missingReport = JSON.parse(readFileSync(missingReportPath, 'utf8'));
  assert(missingReport.plannedInvocations === 2 && missingReport.startedInvocations === 0 && missingReport.completedInvocations === 0, 'ENOENT was incorrectly counted as a started invocation');
  console.log('module behavior runner smoke: isolated SUT denies source fixtures; generator expectations hidden; response frozen; evaluator evidence checked; ENOENT lifecycle honest; 1/1 deterministic fixture passed (not a live model result)');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
