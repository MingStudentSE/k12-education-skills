#!/usr/bin/env node
import {
  EXTERNAL_PROCESSING_SCOPE,
  hasExternalProcessingAuthorization,
  hasLocalAuthorization,
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
  ['one-character-record-invalid', hasLocalAuthorization({ authorized: 'true', authorized_by: 'x' }), false],
  ['external-valid', hasExternalProcessingAuthorization(external, 'https://api.example.com/v1'), true],
  ['provider-change-invalid', hasExternalProcessingAuthorization(external, 'https://other.example.com/v1'), false],
  ['scope-change-invalid', hasExternalProcessingAuthorization({ ...external, external_processing_scope: 'all-data' }, 'https://api.example.com/v1'), false],
];

for (const [name, actual, expected] of cases) {
  if (actual !== expected) throw new Error(`${name}: expected=${expected}, actual=${actual}`);
}
console.log(`authorization contract: ${cases.length}/${cases.length} cases passed`);
