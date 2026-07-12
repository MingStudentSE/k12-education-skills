#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { writeStudentAuthorization } from '../skills/k12-automation/scripts/nightline/authorization.mjs';
import { publishNightAnalysisArtifacts } from '../skills/k12-automation/scripts/nightline/artifact-publisher.mjs';
import { loadRuntimeConfig } from '../skills/k12-automation/scripts/nightline/runtime-config.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-night-cli-'));
const studentsDir = join(tempRoot, 'students');
const logsDir = join(tempRoot, 'logs');
const nightRun = join(ROOT, 'skills/k12-automation/scripts/nightline/night-run.mjs');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function makeStudent(id, { legacy = false } = {}) {
  const dir = join(studentsDir, id);
  mkdirSync(join(dir, 'inbox'), { recursive: true });
  if (legacy) writeFileSync(join(dir, 'profile.md'), `---
id: ${id}
authorized: true
authorized_by: 监护人，2026-07-11，书面同意
authorization_subject: guardian
authorization_date: 2026-07-11
authorization_method: written
external_processing_authorized: false
external_processing_provider:
external_processing_scope:
external_processing_authorization_date:
---

# Mock 学习摘要
`);
  else writeStudentAuthorization(dir, id, {
    authorized: true,
    authorized_by: '监护人，2026-07-11，书面同意（仅本地处理）',
    authorization_subject: 'guardian',
    authorization_date: '2026-07-11',
    authorization_method: 'written',
    authorization_action: 'create',
    external_processing_authorized: false,
    external_processing_provider: '',
    external_processing_scope: '',
    external_processing_authorization_date: '',
  }, 'create', '2026-07-11T12:00:00.000Z');
  writeFileSync(join(dir, 'inbox/sample.md'), `---
subject: math
---

1 + 1 = 3
`);
}

function run(args, envOverrides = {}) {
  return spawnSync(process.execPath, [nightRun, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      K12_ROOT: ROOT,
      K12_STUDENTS_DIR: studentsDir,
      K12_LOG_DIR: logsDir,
      K12_LEARNING_ADAPTER: join(ROOT, 'skills/k12-learning/references/adapters/night-analysis-v1.md'),
      K12_MOCK_LLM: '1',
      ...envOverrides,
    },
    encoding: 'utf8',
  });
}

function assertUntouched(id) {
  const dir = join(studentsDir, id);
  assert(!existsSync(join(dir, 'outbox')), `${id}: invalid CLI created outbox`);
  assert(!existsSync(join(dir, 'archive')), `${id}: invalid CLI created archive`);
  assert(!existsSync(join(dir, 'inbox/processed')), `${id}: invalid CLI moved inbox items`);
  assert(readdirSync(join(dir, 'inbox')).join(',') === 'sample.md', `${id}: invalid CLI changed inbox`);
}

function assertPublishFailureIsClean(name, operationOverrides) {
  const dir = join(tempRoot, `publisher-${name}`);
  const inbox = join(dir, 'inbox');
  mkdirSync(inbox, { recursive: true });
  const itemPath = join(inbox, 'failure.md');
  writeFileSync(itemPath, 'failure fixture');
  let rejected = false;
  try {
    publishNightAnalysisArtifacts({
      studentDir: dir,
      itemPath,
      businessDate: '2026-07-12',
      preferredSlug: 'failure',
      diagnosis: 'diagnosis',
      problems: 'problems',
      solutions: 'solutions',
      archive: 'archive',
    }, operationOverrides);
  } catch { rejected = true; }
  assert(rejected, `${name}: injected publish failure was not observed`);
  assert(existsSync(itemPath), `${name}: failed publish moved the inbox source`);
  const outDir = join(dir, 'outbox/2026-07-12');
  const archiveDir = join(dir, 'archive');
  assert(!existsSync(outDir) || readdirSync(outDir).length === 0, `${name}: failed publish left visible outbox files`);
  assert(!existsSync(archiveDir) || readdirSync(archiveDir).length === 0, `${name}: failed publish left an archive record`);
  const staging = join(dir, 'automation/staging');
  assert(!existsSync(staging) || readdirSync(staging).length === 0, `${name}: failed publish left staging data`);
}

try {
  const mockConfigPath = join(tempRoot, 'mock-placeholder-config.json');
  writeFileSync(mockConfigPath, JSON.stringify({
    apibase: 'https://your-openai-compatible-endpoint/v1/',
    key: 'sk-REPLACE-WITH-YOUR-OWN-KEY',
    model: ' placeholder-model ',
    learningAdapter: ' /tmp/night-analysis-v1.md ',
  }));
  const mockConfig = loadRuntimeConfig({ configPath: mockConfigPath, mock: true });
  assert(mockConfig.model === 'placeholder-model' && mockConfig.learningAdapter === '/tmp/night-analysis-v1.md', 'Mock mode incorrectly required production credentials or failed to normalize adapter path');

  let writes = 0;
  assertPublishFailureIsClean('write', {
    writeFileSync(path, content, options) {
      writes += 1;
      if (writes === 2) throw new Error('injected staging write failure');
      return writeFileSync(path, content, options);
    },
  });
  assertPublishFailureIsClean('rename', {
    renameSync() { throw new Error('injected inbox rename failure'); },
  });

  makeStudent('alpha');
  makeStudent('beta');
  makeStudent('legacy-only', { legacy: true });

  const invalidCases = [
    ['missing-value', ['--student']],
    ['flag-as-value', ['--student', '--all']],
    ['unknown-option', ['--all']],
    ['unexpected-positional', ['alpha']],
    ['extra-argument', ['--student', 'alpha', 'extra']],
    ['illegal-id', ['--student', 'bad/id']],
    ['reserved-id', ['--student', '_template']],
    ['missing-student', ['--student', 'ghost']],
  ];

  for (const [name, args] of invalidCases) {
    const result = run(args);
    assert(Number.isInteger(result.status) && result.status !== 0, `${name}: expected non-zero exit, got ${result.status}`);
    assert(result.stderr.includes('FATAL:'), `${name}: command failed without a controlled CLI error: ${result.stderr}`);
    assert(!`${result.stdout}${result.stderr}`.includes('夜间产线启动'), `${name}: processing started before CLI rejection`);
    assertUntouched('alpha');
    assertUntouched('beta');
    assertUntouched('legacy-only');
    assert(!existsSync(logsDir), `${name}: CLI rejection should happen before runtime logging starts`);
  }

  const invalidAdapterPath = join(tempRoot, 'not-a-learning-adapter.md');
  writeFileSync(invalidAdapterPath, '---\nadapter_contract: wrong\ncontract_version: v1\n---\n');
  const badAdapter = run(['--student', 'alpha'], { K12_LEARNING_ADAPTER: invalidAdapterPath });
  assert(badAdapter.status !== 0, 'incompatible Learning adapter must fail closed');
  assert(`${badAdapter.stdout}${badAdapter.stderr}`.includes('Learning adapter 契约不兼容'), 'adapter failure was not controlled');
  assertUntouched('alpha');
  assertUntouched('beta');
  assertUntouched('legacy-only');

  const legacyFallback = run(['--student', 'legacy-only']);
  assert(legacyFallback.status !== 0, 'steady-state runtime must reject legacy profile authorization fallback');
  assert(`${legacyFallback.stdout}${legacyFallback.stderr}`.includes('缺少有效的 Automation 本地授权记录'), 'legacy-only failure was not controlled');
  assertUntouched('legacy-only');
  rmSync(join(studentsDir, 'legacy-only/inbox/sample.md'));

  const one = run(['--student', 'alpha']);
  assert(one.status === 0, `valid --student failed: ${one.stderr || one.stdout}`);
  assert(existsSync(join(studentsDir, 'alpha/outbox')), 'valid --student did not process selected student');
  assert(existsSync(join(studentsDir, 'alpha/inbox/processed')), 'valid --student did not archive selected inbox item');
  assert(!existsSync(join(studentsDir, 'alpha/profile.md')), 'Automation test fixture unexpectedly created a Learning profile');
  assertUntouched('beta');

  makeStudent('collision');
  rmSync(join(studentsDir, 'collision/inbox/sample.md'));
  writeFileSync(join(studentsDir, 'collision/inbox/same.md'), '---\nsubject: math\n---\n\n1 + 1 = 3\n');
  writeFileSync(join(studentsDir, 'collision/inbox/same.txt'), '---\nsubject: math\n---\n\n2 + 2 = 5\n');

  const all = run([]);
  assert(all.status === 0, `no-argument all-student run failed: ${all.stderr || all.stdout}`);
  assert(existsSync(join(studentsDir, 'beta/outbox')), 'no-argument run did not process remaining Automation-state student');
  const collisionOutRoot = join(studentsDir, 'collision/outbox');
  const collisionDay = readdirSync(collisionOutRoot)[0];
  const collisionOutputs = readdirSync(join(collisionOutRoot, collisionDay));
  for (const label of ['错因诊断', '变式训练题', '答案与讲解']) {
    assert(collisionOutputs.filter(name => name.endsWith(`-${label}.md`)).length === 2, `same-stem ${label} output was overwritten`);
  }
  assert(readdirSync(join(studentsDir, 'collision/archive')).filter(name => name.endsWith('.md')).length === 2, 'same-stem archive count mismatch');
  const processed = readdirSync(join(studentsDir, 'collision/inbox/processed'));
  assert(processed.some(name => name.endsWith('same.md')) && processed.some(name => name.endsWith('same.txt')), 'same-stem sources were not both preserved');

  console.log(`night CLI smoke: ${invalidCases.length} invalid CLI + adapter/legacy rejection + staged rollback + same-stem no-clobber passed`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
