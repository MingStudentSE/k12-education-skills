#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  AUTOMATION_STATE_SCHEMA,
  EXTERNAL_PROCESSING_SCOPE,
  hasExternalProcessingAuthorization,
  hasLocalAuthorization,
  readStudentAuthorization,
  writeStudentAuthorization,
} from '../skills/k12-automation/scripts/nightline/authorization.mjs';

const local = {
  authorized: 'true',
  authorized_by: '监护人，2026-07-11，书面同意',
  authorization_subject: 'guardian',
  authorization_date: '2026-07-11',
  authorization_method: 'written',
};
const external = {
  ...local,
  external_processing_authorized: 'true',
  external_processing_provider: 'https://api.example.com',
  external_processing_scope: EXTERNAL_PROCESSING_SCOPE,
  external_processing_authorization_date: '2026-07-11',
};
const cases = [
  ['local-valid', hasLocalAuthorization(local), true],
  ['json-boolean-local-valid', hasLocalAuthorization({ ...local, authorized: true }), true],
  ['one-character-record-invalid', hasLocalAuthorization({ authorized: 'true', authorized_by: 'x' }), false],
  ['external-valid', hasExternalProcessingAuthorization(external, 'https://api.example.com/v1'), true],
  ['provider-change-invalid', hasExternalProcessingAuthorization(external, 'https://other.example.com/v1'), false],
  ['scope-change-invalid', hasExternalProcessingAuthorization({ ...external, external_processing_scope: 'all-data' }, 'https://api.example.com/v1'), false],
  ['legacy-profile-scope-invalid', hasExternalProcessingAuthorization({ ...external, external_processing_scope: 'profile-summary,current-mistake,recent-3-archives' }, 'https://api.example.com/v1'), false],
];

for (const [name, actual, expected] of cases) {
  if (actual !== expected) throw new Error(`${name}: expected=${expected}, actual=${actual}`);
}

const authorizationUrl = new URL('../skills/k12-automation/scripts/nightline/authorization.mjs', import.meta.url).href;
const businessTimeUrl = new URL('../skills/k12-automation/scripts/nightline/business-time.mjs', import.meta.url).href;
const crossZone = spawnSync(process.execPath, ['--input-type=module', '-e', `
  import { validateAuthorizationInput } from ${JSON.stringify(authorizationUrl)};
  import { businessDate } from ${JSON.stringify(businessTimeUrl)};
  const date = businessDate();
  const error = validateAuthorizationInput({ subject: 'guardian', date, method: 'written' });
  if (error) throw new Error(date + ': ' + error);
`], {
  env: { ...process.env, TZ: 'Etc/GMT+12', K12_TIME_ZONE: 'Pacific/Kiritimati' },
  encoding: 'utf8',
});
if (crossZone.status !== 0) throw new Error(`授权日期没有统一使用 K12_TIME_ZONE：${crossZone.stderr}`);

const tempRoot = mkdtempSync(join(tmpdir(), 'k12-authorization-'));
try {
  const studentDir = join(tempRoot, 'legacy-student');
  mkdirSync(studentDir, { recursive: true });
  const legacyProfile = `---\nid: legacy-student\nauthorized: true\nauthorized_by: 监护人，2026-07-11，书面同意\nauthorization_subject: guardian\nauthorization_date: 2026-07-11\nauthorization_method: written\nexternal_processing_authorized: false\nexternal_processing_provider:\nexternal_processing_scope:\nexternal_processing_authorization_date:\n---\n\n# Learning-owned profile\n\n不应被 Automation 改写。\n`;
  const profilePath = join(studentDir, 'profile.md');
  writeFileSync(profilePath, legacyProfile);
  const noConsentDir = join(tempRoot, 'learning-only');
  mkdirSync(noConsentDir, { recursive: true });
  writeFileSync(join(noConsentDir, 'profile.md'), '---\nid: learning-only\n---\n\n# 只有 Learning State\n');
  const invalidStateDir = join(tempRoot, 'state-only-invalid');
  mkdirSync(join(invalidStateDir, 'automation'), { recursive: true });
  writeFileSync(join(invalidStateDir, 'automation/state.json'), '{"schema_version":"broken"}\n');
  const legacy = readStudentAuthorization(studentDir);
  if (legacy.source !== 'none' || hasLocalAuthorization(legacy.record)) {
    throw new Error('steady-state runtime fell back to Learning-owned legacy profile');
  }

  const migration = fileURLToPath(new URL('../skills/k12-automation/scripts/nightline/migrate-legacy-authorization.mjs', import.meta.url));
  const runMigration = args => spawnSync(process.execPath, [migration, ...args], {
    env: { ...process.env, K12_STUDENTS_DIR: tempRoot },
    encoding: 'utf8',
  });
  const before = runMigration(['--audit']);
  const beforeAudit = before.status === 0 ? JSON.parse(before.stdout) : null;
  if (!beforeAudit || beforeAudit.exit_ready !== false
    || JSON.stringify(beforeAudit.legacy_candidates) !== JSON.stringify(['legacy-student'])
    || beforeAudit.learning_profiles_without_legacy_authorization?.[0]?.id !== 'learning-only'
    || beforeAudit.invalid_automation_states?.[0]?.id !== 'state-only-invalid') {
    throw new Error(`legacy migration audit did not expose the candidate: ${before.stderr || before.stdout}`);
  }
  rmSync(invalidStateDir, { recursive: true, force: true });
  const migratedResult = runMigration(['--student', 'legacy-student', '--confirm']);
  if (migratedResult.status !== 0) throw new Error(`explicit legacy migration failed: ${migratedResult.stderr}`);
  const migrated = readStudentAuthorization(studentDir);
  if (migrated.source !== 'automation-state' || migrated.state.schema_version !== AUTOMATION_STATE_SCHEMA
    || !hasLocalAuthorization(migrated.record)) {
    throw new Error('explicit migration did not establish valid Automation-owned state');
  }
  if (hasExternalProcessingAuthorization(migrated.record, 'https://api.example.com')) {
    throw new Error('migration inherited external-processing authorization');
  }
  const after = runMigration(['--audit']);
  const afterAudit = after.status === 0 ? JSON.parse(after.stdout) : null;
  if (!afterAudit || afterAudit.exit_ready !== true || afterAudit.legacy_candidates.length !== 0
    || afterAudit.learning_profiles_without_legacy_authorization?.[0]?.id !== 'learning-only') {
    throw new Error(`legacy migration did not reach its explicit exit: ${after.stderr || after.stdout}`);
  }
  if (readFileSync(profilePath, 'utf8') !== legacyProfile) throw new Error('Automation modified Learning-owned legacy profile');

  const statePath = join(studentDir, 'automation/state.json');
  const invalid = JSON.parse(readFileSync(statePath, 'utf8'));
  invalid.learning_profile = { grade: '禁止进入 Automation state' };
  writeFileSync(statePath, `${JSON.stringify(invalid, null, 2)}\n`);
  let rejected = false;
  try { readStudentAuthorization(studentDir); }
  catch (error) { rejected = /不允许额外字段/.test(error.message); }
  if (!rejected) throw new Error('runtime did not validate Automation state against its schema');

  const contradictionDir = join(tempRoot, 'contradictory-state');
  mkdirSync(contradictionDir, { recursive: true });
  rejected = false;
  try {
    writeStudentAuthorization(contradictionDir, 'contradictory-state', {
      authorized: false,
      authorized_by: '已撤回',
      authorization_subject: 'guardian',
      authorization_date: '2026-07-11',
      authorization_method: 'written',
      authorization_action: 'revoke-local',
      external_processing_authorized: true,
      external_processing_provider: 'https://api.example.com',
      external_processing_scope: EXTERNAL_PROCESSING_SCOPE,
      external_processing_authorization_date: '2026-07-11',
    }, 'revoke-local', '2026-07-11T12:00:00.000Z');
  } catch (error) { rejected = /必须等于 true/.test(error.message); }
  if (!rejected) throw new Error('state schema accepted external authorization while local authorization was false');

  rejected = false;
  try {
    writeStudentAuthorization(contradictionDir, 'contradictory-state', {
      authorized: true,
      authorized_by: '监护人，2026-07-11，书面同意',
      authorization_subject: 'guardian',
      authorization_date: '2026-07-11',
      authorization_method: 'written',
      authorization_action: 'create',
      external_processing_authorized: false,
      external_processing_provider: '',
      external_processing_scope: '',
      external_processing_authorization_date: '',
    }, 'update', '2026-07-11T12:00:00.000Z');
  } catch (error) { rejected = /必须等于 "create"/.test(error.message); }
  if (!rejected) throw new Error('state schema accepted mismatched authorization.action and runtime.last_action');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log(`authorization contract: ${cases.length}/${cases.length} fields + business timezone + classified migration + contradictory state rejection passed`);
