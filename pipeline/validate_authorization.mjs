#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
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

const tempRoot = mkdtempSync(join(tmpdir(), 'k12-authorization-'));
try {
  const studentDir = join(tempRoot, 'legacy-student');
  mkdirSync(studentDir, { recursive: true });
  const legacyProfile = `---\nid: legacy-student\nauthorized: true\nauthorized_by: 监护人，2026-07-11，书面同意\nauthorization_subject: guardian\nauthorization_date: 2026-07-11\nauthorization_method: written\nexternal_processing_authorized: false\nexternal_processing_provider:\nexternal_processing_scope:\nexternal_processing_authorization_date:\n---\n\n# Learning-owned profile\n\n不应被 Automation 改写。\n`;
  const profilePath = join(studentDir, 'profile.md');
  writeFileSync(profilePath, legacyProfile);
  const legacy = readStudentAuthorization(studentDir);
  if (legacy.source !== 'legacy-profile' || !hasLocalAuthorization(legacy.record)) {
    throw new Error('legacy profile authorization compatibility failed');
  }

  writeStudentAuthorization(studentDir, 'legacy-student', {
    ...local,
    authorized: false,
    authorization_action: 'revoke-local',
    external_processing_authorized: false,
    external_processing_provider: '',
    external_processing_scope: '',
    external_processing_authorization_date: '',
  }, 'revoke-local', '2026-07-11T12:00:00.000Z');
  const revoked = readStudentAuthorization(studentDir);
  if (revoked.source !== 'automation-state' || revoked.state.schema_version !== AUTOMATION_STATE_SCHEMA) {
    throw new Error('Automation state did not take ownership after authorization update');
  }
  if (hasLocalAuthorization(revoked.record)) throw new Error('legacy profile restored revoked Automation authorization');
  if (readFileSync(profilePath, 'utf8') !== legacyProfile) throw new Error('Automation modified Learning-owned legacy profile');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log(`authorization contract: ${cases.length}/${cases.length} field cases + legacy read/new-state precedence passed`);
