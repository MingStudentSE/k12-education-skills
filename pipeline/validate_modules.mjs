#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SKILLS = join(ROOT, 'skills');
const expected = ['k12-automation', 'k12-learning', 'k12-skill-studio', 'llm-wiki'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(readFileSync(join(ROOT, 'VERSION'), 'utf8').trim() === 'V3.0', 'release VERSION must be V3.0');

function walk(dir, filename) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path, filename));
    else if (!filename || name === filename) out.push(path);
  }
  return out;
}

const topModules = readdirSync(SKILLS)
  .filter(name => statSync(join(SKILLS, name)).isDirectory() && existsSync(join(SKILLS, name, 'SKILL.md')))
  .sort();
assert(JSON.stringify(topModules) === JSON.stringify(expected), `expected four Product Modules, got ${topModules}`);
const allSkillFiles = walk(SKILLS, 'SKILL.md');
assert(allSkillFiles.length === 4, `nested/extra Skill interfaces found: ${allSkillFiles.map(p => relative(ROOT, p))}`);

let totalTests = 0;
for (const name of expected) {
  const dir = join(SKILLS, name);
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const lines = text.split(/\r?\n/).length;
  assert(lines <= 150, `${name}/SKILL.md is shallow/noisy at ${lines} lines; keep interface <=150`);
  const header = text.match(/^---\n([\s\S]*?)\n---/);
  assert(header, `${name}: missing YAML frontmatter`);
  assert(new RegExp(`^name:\\s*${name}$`, 'm').test(header[1]), `${name}: frontmatter name mismatch`);
  const description = header[1].match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';
  assert(description.length >= 30 && description.length < 1024, `${name}: description must be 30..1023 chars`);
  assert(!/\[TODO|TODO:/.test(text), `${name}: TODO remains`);
  for (const match of text.matchAll(/`((?:references|schemas|scripts|assets)\/[^`\s]+)`/g)) {
    const path = join(dir, match[1].replace(/[，。；：,.;:]$/, ''));
    assert(existsSync(path), `${name}: dangling resource ${match[1]}`);
  }
  const tests = JSON.parse(readFileSync(join(dir, 'test-prompts.json'), 'utf8'));
  assert(Array.isArray(tests) && tests.length, `${name}: missing behavior tests`);
  totalTests += tests.length;
}
assert(totalTests >= 203, `behavior coverage regressed below legacy 203 cases: ${totalTests}`);

const learning = join(SKILLS, 'k12-learning');
const capabilityMap = JSON.parse(readFileSync(join(learning, 'references/capability-map.json'), 'utf8'));
const capabilities = capabilityMap.capabilities;
assert(capabilityMap.capabilityCount === 58 && capabilities.length === 58, 'k12-learning must expose 58 internal capabilities');
const names = capabilities.map(item => item.name);
assert(new Set(names).size === names.length, 'capability names must be unique');
for (const item of capabilities) {
  const playbook = join(learning, item.playbook);
  assert(existsSync(playbook), `missing capability playbook: ${item.name}`);
  assert(readFileSync(playbook, 'utf8').includes('> **内部 playbook**'), `playbook lacks internal-interface guard: ${item.name}`);
}
const routeTests = JSON.parse(readFileSync(join(learning, 'test-prompts.json'), 'utf8'));
const allowedRouteModes = new Set(['DIRECT', 'INTAKE', 'COMPOSE', 'CLARIFY', 'ORDINARY', 'MODULE_REQUIRED']);
const allowedModules = new Set(['llm-wiki', 'k12-automation', 'k12-skill-studio']);
for (const test of routeTests.filter(item => item.expected_route)) {
  const route = test.expected_route;
  assert(allowedRouteModes.has(route.mode), `legacy/unknown route mode in ${test.id}: ${route.mode}`);
  assert(!Object.hasOwn(route, 'primarySkill'), `legacy primarySkill field remains in ${test.id}`);
  if (route.mode === 'MODULE_REQUIRED') {
    assert(allowedModules.has(route.moduleRequired), `invalid module seam in ${test.id}: ${route.moduleRequired}`);
    assert(!route.primaryPlaybook, `module seam must not name a learning playbook in ${test.id}`);
  } else if (['DIRECT', 'INTAKE', 'COMPOSE'].includes(route.mode)) {
    assert(names.includes(route.primaryPlaybook), `unknown primary playbook in ${test.id}: ${route.primaryPlaybook}`);
  } else {
    assert(route.primaryPlaybook === null, `${route.mode} must not select a playbook in ${test.id}`);
  }
}
const covered = new Set(routeTests.map(test => test.expected_route?.primaryPlaybook).filter(Boolean));
assert(names.every(name => covered.has(name)), `capability route coverage missing: ${names.filter(name => !covered.has(name))}`);

const playbooks = walk(SKILLS, 'playbook.md');
assert(playbooks.length === 61, `expected 61 internal playbooks, got ${playbooks.length}`);

const mapping = JSON.parse(readFileSync(join(ROOT, 'docs/legacy-skill-mapping.json'), 'utf8'));
assert(mapping.version === 'V3.0', 'legacy source map must identify release V3.0');
assert(mapping.legacySkillCount === 63 && mapping.mappings.length === 63, 'legacy source map must cover 63 old Skills');
assert(new Set(mapping.mappings.map(item => item.legacy_skill)).size === 63, 'legacy source map names must be unique');
for (const item of mapping.mappings) assert(existsSync(join(ROOT, item.new_path)), `source map target missing: ${item.legacy_skill}`);

for (const removed of ['general', 'chinese', 'math', 'english', 'physics', 'history', 'geography', 'politics', 'chemistry', 'biology']) {
  assert(!existsSync(join(SKILLS, removed)), `legacy Skill category still exists: skills/${removed}`);
}
assert(!existsSync(join(ROOT, 'engine')), 'legacy root engine/ still exists');
assert(!existsSync(join(ROOT, 'students')), 'legacy root students/ template still exists');
for (const file of ['night-run.mjs', 'server.mjs', 'build-dashboard.mjs', 'authorization.mjs', 'business-time.mjs', 'config.sample.json']) {
  assert(existsSync(join(SKILLS, 'k12-automation/scripts/nightline', file)), `automation runtime missing ${file}`);
}
const wikiMain = readFileSync(join(SKILLS, 'llm-wiki/SKILL.md'), 'utf8');
for (const layer of ['100-Raw', '200-Wiki', '300-Output', '999-Assets']) assert(wikiMain.includes(layer), `llm-wiki missing ${layer}`);
assert(!wikiMain.includes('.codex/skills'), 'llm-wiki must not hardcode deprecated Codex path');

const installPromptPath = join(ROOT, 'docs/ai-install-prompt.md');
assert(existsSync(installPromptPath), 'AI-first install prompt is missing');
const installPrompt = readFileSync(installPromptPath, 'utf8');
for (const marker of [
  '请安装 k12-learning 和 llm-wiki Skill。',
  '请安装 k12-automation Skill。',
  '请安装 k12-skill-studio Skill。',
  '由 AI 自行处理',
]) assert(installPrompt.includes(marker), `AI install prompt missing contract marker: ${marker}`);
for (const file of ['README.md', 'docs/getting-started.md', 'docs/installation-guide.md', 'docs/user-quickstart-sop.md']) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  assert(text.includes('请安装 k12-learning 和 llm-wiki Skill。'), `${file} must lead with the one-line AI install intent`);
  assert(!text.includes('cp -R skills/k12-learning'), `${file} must not lead ordinary users through manual copy commands`);
}

console.log(`module contract: 4 Product Modules, 61 playbooks, 58 capabilities, 63 source mappings, ${totalTests} behavior cases`);
