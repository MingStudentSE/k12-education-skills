#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { spawnSync } from 'child_process';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-night-cli-'));
const studentsDir = join(tempRoot, 'students');
const logsDir = join(tempRoot, 'logs');
const nightRun = join(ROOT, 'skills/k12-automation/scripts/nightline/night-run.mjs');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function makeStudent(id) {
  const dir = join(studentsDir, id);
  mkdirSync(join(dir, 'inbox'), { recursive: true });
  writeFileSync(join(dir, 'profile.md'), `---
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
  writeFileSync(join(dir, 'inbox/sample.md'), `---
subject: math
---

1 + 1 = 3
`);
}

function run(args) {
  return spawnSync(process.execPath, [nightRun, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      K12_ROOT: ROOT,
      K12_STUDENTS_DIR: studentsDir,
      K12_LOG_DIR: logsDir,
      K12_LEARNING_DIR: join(ROOT, 'skills/k12-learning'),
      K12_MOCK_LLM: '1',
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

try {
  makeStudent('alpha');
  makeStudent('beta');

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
    assert(!existsSync(logsDir), `${name}: CLI rejection should happen before runtime logging starts`);
  }

  const one = run(['--student', 'alpha']);
  assert(one.status === 0, `valid --student failed: ${one.stderr || one.stdout}`);
  assert(existsSync(join(studentsDir, 'alpha/outbox')), 'valid --student did not process selected student');
  assert(existsSync(join(studentsDir, 'alpha/inbox/processed')), 'valid --student did not archive selected inbox item');
  assertUntouched('beta');

  const all = run([]);
  assert(all.status === 0, `no-argument all-student run failed: ${all.stderr || all.stdout}`);
  assert(existsSync(join(studentsDir, 'beta/outbox')), 'no-argument run did not process remaining student');

  console.log(`night CLI smoke: ${invalidCases.length} invalid cases rejected; exact-student and no-argument modes passed`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
