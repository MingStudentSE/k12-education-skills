#!/usr/bin/env node
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-structured-runner-smoke-'));
const fakeCodex = join(tempRoot, 'fake-codex.mjs');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const fakeSource = `#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output-last-message');
if (outputIndex < 0) throw new Error('missing --output-last-message');
const output = args[outputIndex + 1];
const input = await new Promise((resolve, reject) => {
  let text = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { text += chunk; });
  process.stdin.on('end', () => resolve(text));
  process.stdin.on('error', reject);
});

if (existsSync('skills/k12-learning/test-prompts.json')) throw new Error('isolated structured SUT contains test-prompts.json');
let sourceDenied = false;
try {
  readFileSync(process.env.SMOKE_ORIGINAL_FIXTURE, 'utf8');
} catch (error) {
  sourceDenied = error?.code === 'EPERM' || error?.code === 'EACCES';
}
if (!sourceDenied) throw new Error('structured runner could read the original fixture path');

if (input.includes('direct-math-problem')) {
  writeFileSync(output, JSON.stringify({ results: [{
    caseId: 'direct-math-problem',
    decision: {
      mode: 'DIRECT',
      primaryPlaybook: 'math-problem-solving-coach',
      supportingPlaybooks: [],
      confidence: 'high',
      matchedSignals: ['导数题', '第二步卡住'],
      constraints: { sessionOnly: true, noStateRead: true, noStateWrite: true, noAutomation: true, noSilentInstall: true },
      moduleRequired: null,
      clarification: null,
    },
  }] }));
} else if (input.includes('curriculum-high-school-2022-out-of-scope')) {
  writeFileSync(output, JSON.stringify({ results: [{
    caseId: 'curriculum-high-school-2022-out-of-scope',
    evidencePlan: {
      scopeStatus: 'out-of-scope',
      standardId: null,
      routeSubject: 'politics',
      subjectId: null,
      competencyId: null,
      modelId: null,
      sourceEvidence: null,
      observableEvidence: [],
      learningTask: null,
      feedbackAdjustment: null,
      scopeNote: '高二不属于 2022 义务教育课程标准适用范围。',
      constraints: {
        sessionOnly: true,
        noStateWrite: true,
        singleObservationIsMastery: false,
        maxSelectedModels: 1,
        noExtraAssessment: true,
        studentActionRequired: true,
        maxShortActions: null,
      },
    },
  }] }));
} else if (input.includes('curriculum-primary-science-unsupported-route')) {
  writeFileSync(output, JSON.stringify({ results: [{
    caseId: 'curriculum-primary-science-unsupported-route',
    evidencePlan: {
      scopeStatus: 'unsupported-route',
      standardId: null,
      routeSubject: 'science',
      subjectId: null,
      competencyId: null,
      modelId: null,
      sourceEvidence: null,
      observableEvidence: [],
      learningTask: null,
      feedbackAdjustment: null,
      scopeNote: '当前没有小学科学专用证据模型，不能冒充 2022 科学课程对齐。',
      constraints: {
        sessionOnly: true,
        noStateWrite: true,
        singleObservationIsMastery: false,
        maxSelectedModels: 1,
        noExtraAssessment: true,
        studentActionRequired: true,
        maxShortActions: null,
      },
    },
  }] }));
} else if (input.includes('curriculum-math-modeling-evidence')) {
  writeFileSync(output, JSON.stringify({ results: [{
    caseId: 'curriculum-math-modeling-evidence',
    evidencePlan: {
      scopeStatus: 'applies',
      standardId: 'cn-compulsory-2022',
      routeSubject: 'math',
      subjectId: 'math',
      competencyId: 'math.express-world',
      modelId: 'math.express-world.model-representation.v1',
      sourceEvidence: {
        standardUrl: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf',
        section: '三、课程目标 / （一）核心素养内涵 / 核心素养的构成',
        pdfPage: 13,
        sha256: '1183b95c58a65eaac4c456f2d2b329bbe42f65a6482993edb537e3eaf8baa144',
      },
      observableEvidence: ['能用图、表、式、方程或文字表示现实关系'],
      learningTask: {
        instruction: '请先画出数量关系图，再据此设元并列出方程。',
        successCriteria: ['关键数量关系完整', '每个量和单位有解释'],
      },
      feedbackAdjustment: {
        whenMissing: '先画数量关系图，不急于列式。',
        whenEmerging: '逐个解释符号、单位和等号两边含义。',
        whenDemonstrated: '改变现实条件并修改模型。',
        retest: '用新情境独立完成关系模型解释。',
      },
      scopeNote: '使用数学语言表达现实世界的精确课标来源页。',
      constraints: {
        sessionOnly: true,
        noStateWrite: true,
        singleObservationIsMastery: false,
        maxSelectedModels: 1,
        noExtraAssessment: true,
        studentActionRequired: true,
        maxShortActions: null,
      },
    },
  }] }));
} else {
  throw new Error('unexpected regression prompt');
}
`;

function run(script, args, codex = fakeCodex) {
  return spawnSync(process.execPath, [join(ROOT, 'pipeline', script), ...args, '--codex-bin', codex], {
    cwd: ROOT,
    env: { ...process.env, SMOKE_ORIGINAL_FIXTURE: join(ROOT, 'skills/k12-learning/test-prompts.json') },
    encoding: 'utf8',
    timeout: 30_000,
  });
}

try {
  writeFileSync(fakeCodex, fakeSource, 'utf8');
  chmodSync(fakeCodex, 0o755);

  const route = run('run_v3_route_regression.mjs', ['--case', 'direct-math-problem', '--batch-size', '40']);
  assert(route.status === 0, `route runner smoke failed: ${route.stderr || route.stdout}`);
  assert(route.stdout.includes('[PASS] direct-math-problem') && route.stdout.includes('1/1 passed; planned=1, started=1, completed=1'), 'route runner did not execute and validate one batched result');

  const curriculum = run('run_curriculum_evidence_regression.mjs', ['--case', 'curriculum-high-school-2022-out-of-scope', '--batch-size', '10']);
  assert(curriculum.status === 0, `curriculum runner smoke failed: ${curriculum.stderr || curriculum.stdout}`);
  assert(curriculum.stdout.includes('[PASS] curriculum-high-school-2022-out-of-scope') && curriculum.stdout.includes('1/1 passed; planned=1, started=1, completed=1'), 'curriculum runner did not execute and validate one batched result');

  const unsupported = run('run_curriculum_evidence_regression.mjs', ['--case', 'curriculum-primary-science-unsupported-route', '--batch-size', '10']);
  assert(unsupported.status === 0 && unsupported.stdout.includes('[PASS] curriculum-primary-science-unsupported-route'), `unsupported-route runner smoke failed: ${unsupported.stderr || unsupported.stdout}`);

  const exactLocator = run('run_curriculum_evidence_regression.mjs', ['--case', 'curriculum-math-modeling-evidence', '--batch-size', '10']);
  assert(exactLocator.status === 0 && exactLocator.stdout.includes('[PASS] curriculum-math-modeling-evidence'), `competency sourcePage runner smoke failed: ${exactLocator.stderr || exactLocator.stdout}`);

  const missing = join(tempRoot, 'missing-codex');
  const missingRoute = run('run_v3_route_regression.mjs', ['--case', 'direct-math-problem'], missing);
  assert(missingRoute.status === 1 && missingRoute.stdout.includes('planned=1, started=0, completed=0'), 'route runner counted ENOENT as a started invocation');
  const missingCurriculum = run('run_curriculum_evidence_regression.mjs', ['--case', 'curriculum-high-school-2022-out-of-scope'], missing);
  assert(missingCurriculum.status === 1 && missingCurriculum.stdout.includes('planned=1, started=0, completed=0'), 'curriculum runner counted ENOENT as a started invocation');

  console.log('structured regression runner smoke: route batch + curriculum out-of-scope/unsupported/exact-sourcePage fixtures passed; source fixtures denied and ENOENT lifecycle honest (not live model results)');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
