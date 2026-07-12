#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const AUTO = join(ROOT, 'skills/k12-automation');
const LEARNING = join(ROOT, 'skills/k12-learning');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = path => readFileSync(path, 'utf8');

const nightPath = join(AUTO, 'scripts/nightline/night-run.mjs');
const night = read(nightPath);
assert(night.includes("'references', 'adapters', 'night-analysis-v1.md'"), 'night-run must use the fixed Learning adapter interface');
assert(night.includes('readFileSync(LEARNING_ADAPTER'), 'night-run does not load the configured Learning adapter file');
for (const forbidden of ["'references', 'playbooks'", 'PLAYBOOK_MAP', 'K12_LEARNING_DIR', 'learningDir']) {
  assert(!night.includes(forbidden), `night-run leaked Learning implementation detail: ${forbidden}`);
}
assert(!/join\(stuDir,\s*['"]profile\.md['"]\)/.test(night), 'night-run directly reads Learning profile state');

const adapterPath = join(LEARNING, 'references/adapters/night-analysis-v1.md');
const adapter = read(adapterPath);
assert(/^---\n[\s\S]*?adapter_contract: k12-learning\/night-analysis[\s\S]*?contract_version: v1[\s\S]*?\n---/.test(adapter), 'Learning night adapter identity/version missing');
for (const marker of ['DIAGNOSIS', 'ARCHIVE', 'PROBLEMS', 'SOLUTIONS']) {
  assert(adapter.includes(`<<<${marker}>>>`), `Learning night adapter missing ${marker}`);
}
const requestSchema = JSON.parse(read(join(LEARNING, 'schemas/night-analysis-request-v1.schema.json')));
assert(requestSchema.properties?.contract_version?.const === 'v1', 'night request schema version mismatch');

const authorization = read(join(AUTO, 'scripts/nightline/authorization.mjs'));
assert(authorization.includes("EXTERNAL_PROCESSING_SCOPE = 'current-mistake,recent-3-archives'"), 'external scope includes data Automation v1 does not send');
assert(authorization.includes("join(studentDir, 'profile.md')"), 'legacy profile authorization fallback was removed');
assert(authorization.includes("join(studentDir, 'automation', 'state.json')"), 'Automation-owned state path missing');

const server = read(join(AUTO, 'scripts/nightline/server.mjs'));
assert(!/writeFileSync\([^\n]*profile\.md/.test(server), 'server writes Learning-owned profile.md');
assert(!/join\(dir,\s*['"]profile\.md['"]\)/.test(server), 'server directly reads Learning profile fields');
const dashboard = read(join(AUTO, 'scripts/nightline/build-dashboard.mjs'));
assert(!/profile\.md|readFrontmatterPrefix/.test(dashboard), 'dashboard directly reads Learning profile state');

const config = JSON.parse(read(join(AUTO, 'scripts/nightline/config.sample.json')));
assert(Object.hasOwn(config, 'learningAdapter') && !Object.hasOwn(config, 'learningDir'), 'sample config exposes the wrong Learning seam');
const templateProfile = join(AUTO, 'assets/student-template/profile.md');
assert(!existsSync(templateProfile), 'Automation template must not ship a Learning profile');
const templateState = JSON.parse(read(join(AUTO, 'assets/student-template/automation/state.json')));
assert(templateState.schema_version === 'k12-automation-state/v1', 'Automation template state version mismatch');
assert(templateState.authorization.local.authorized === false && templateState.authorization.external_processing.authorized === false, 'Automation template must default to no authorization');

for (const name of ['k12-nightline-guide.md', 'k12-nightline-handover.md']) {
  assert(
    read(join(ROOT, 'docs', name)) === read(join(AUTO, 'references', 'nightline', name)),
    `${name} drifted from the packaged Automation reference`,
  );
}

console.log('automation seam: versioned Learning adapter, separate state ownership, legacy auth fallback, minimal external scope and synced docs passed');
