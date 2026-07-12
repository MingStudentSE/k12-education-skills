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
  const maxLines = name === 'llm-wiki' ? 300 : 150;
  assert(lines <= maxLines, `${name}/SKILL.md is shallow/noisy at ${lines} lines; keep interface <=${maxLines}`);
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
assert(!names.includes('skill-coordinator'), 'deep module must compose playbooks directly; skill-coordinator must not return');
assert(names.includes('system-guide'), 'k12-learning must expose the internal system-guide capability');
assert(!existsSync(join(learning, 'references/playbooks/general/skill-coordinator')), 'legacy skill-coordinator directory must not return');
for (const item of capabilities) {
  assert(['DIRECT', 'INTAKE'].includes(item.mode), `capability map uses legacy/unknown mode for ${item.name}: ${item.mode}`);
}
for (const item of capabilities) {
  const playbook = join(learning, item.playbook);
  assert(existsSync(playbook), `missing capability playbook: ${item.name}`);
  assert(readFileSync(playbook, 'utf8').includes('> **内部 playbook**'), `playbook lacks internal-interface guard: ${item.name}`);
}
const routeTests = JSON.parse(readFileSync(join(learning, 'test-prompts.json'), 'utf8'));
const allowedRouteModes = new Set(['DIRECT', 'INTAKE', 'COMPOSE', 'CLARIFY', 'ORDINARY', 'MODULE_REQUIRED']);
const allowedModules = new Set(['llm-wiki', 'k12-automation', 'k12-skill-studio']);
const structuredRouteTests = routeTests.filter(item => item.expected_route);
assert(new Set(structuredRouteTests.map(item => item.id)).size === structuredRouteTests.length, 'structured route test ids must be unique');
for (const test of structuredRouteTests) {
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
  const supporting = route.supportingPlaybooks || [];
  assert(Array.isArray(supporting), `${test.id}: supportingPlaybooks must be an array when present`);
  assert(supporting.length <= 2, `${test.id}: at most two supporting playbooks are allowed`);
  assert(new Set(supporting).size === supporting.length, `${test.id}: supporting playbooks must be unique`);
  assert(supporting.every(name => names.includes(name)), `${test.id}: unknown supporting playbook`);
  assert(!supporting.includes(route.primaryPlaybook), `${test.id}: primary playbook cannot also be supporting`);
  if (route.mode === 'COMPOSE') assert(supporting.length >= 1, `${test.id}: COMPOSE must assert at least one supporting playbook`);
  else assert(supporting.length === 0, `${test.id}: only COMPOSE may assert supporting playbooks`);
}
const covered = new Set(routeTests.map(test => test.expected_route?.primaryPlaybook).filter(Boolean));
assert(names.every(name => covered.has(name)), `capability route coverage missing: ${names.filter(name => !covered.has(name))}`);

const playbooks = walk(SKILLS, 'playbook.md');
assert(playbooks.length === 61, `expected 61 internal playbooks, got ${playbooks.length}`);

const mapping = JSON.parse(readFileSync(join(ROOT, 'docs/legacy-skill-mapping.json'), 'utf8'));
assert(mapping.version === 'V3.0', 'legacy source map must identify release V3.0');
assert(mapping.legacySkillCount === 63 && mapping.mappings.length === 63, 'legacy source map must cover 63 old Skills');
assert(mapping.sourceSnapshot?.gitTrackedSkillCount === 62, 'source map must disclose the 62 Git-tracked legacy Skills');
assert(mapping.sourceSnapshot?.gitCommit === '42d1f0d2453f618c7ca1c1227bbcfb2801edf9ea', 'source map must pin the auditable legacy commit');
assert(JSON.stringify(mapping.sourceSnapshot?.auditOnlyLegacySkills) === JSON.stringify(['k12-learning-router']), 'source map must isolate the audit-only router provenance');
assert(mapping.sourceSnapshot.gitTrackedSkillCount + mapping.sourceSnapshot.auditOnlyLegacySkills.length === mapping.legacySkillCount, 'Git-tracked plus audit-only source counts must equal legacySkillCount');
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
for (const canonicalSection of ['Resume an Existing Wiki', '200-Wiki/SCHEMA.md', 'Core Operations', 'Bulk ingest', 'Obsidian link-integrity loop', 'V3 Module Boundary']) {
  assert(wikiMain.includes(canonicalSection), `llm-wiki lost canonical Hermes workflow section: ${canonicalSection}`);
}

const installPromptPath = join(ROOT, 'docs/ai-install-prompt.md');
assert(existsSync(installPromptPath), 'AI-first install prompt is missing');
const installPrompt = readFileSync(installPromptPath, 'utf8');
for (const marker of [
  'https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning',
  'https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki',
  'https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-automation',
  'https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-skill-studio',
  '由 AI 自行处理',
]) assert(installPrompt.includes(marker), `AI install prompt missing contract marker: ${marker}`);
assert(installPrompt.includes('k12-learning：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning'), 'AI install prompt must expose k12-learning as copyable URL text');
assert(installPrompt.includes('llm-wiki：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki'), 'AI install prompt must expose llm-wiki as copyable URL text');
const markdownModuleLink = /\[(?:k12-learning|llm-wiki|k12-automation|k12-skill-studio)\]\(https:\/\/github\.com\/MingStudentSE\/k12-education-skills\/tree\/main\/skills\//;
assert(!markdownModuleLink.test(installPrompt), 'AI install prompt must not hide module URLs behind Markdown links');
for (const file of ['README.md', 'docs/getting-started.md', 'docs/installation-guide.md', 'docs/user-quickstart-sop.md', 'skills/k12-learning/references/system-user-guide.md']) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  assert(text.includes('https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning'), `${file} must link the default learning module for users without a checkout`);
  assert(text.includes('https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki'), `${file} must link the default Wiki module for users without a checkout`);
  assert(!markdownModuleLink.test(text), `${file} must use copyable module URL text instead of Markdown module links`);
  assert(!text.includes('cp -R skills/k12-learning'), `${file} must not lead ordinary users through manual copy commands`);
}
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
for (const marker of [
  '面向学生、家长和老师的 AI 学习系统',
  '## 我们相信：差距在学习闭环，不在标签',
  '分析现状',
  '查漏补缺',
  '不断反馈',
  '## 它的价值，不是“多一个会答题的 AI”',
  '## 一次真正有价值的学习，会发生什么',
  '每次学习都留下一个更清楚的下一步',
  '## 你会得到什么',
  '## 第一次使用：10 分钟内从真实材料开始',
  '## 让学习积累下来：llm-wiki',
  '## 你的资料由你控制',
  '## 这个系统如何组织',
]) assert(readme.includes(marker), `README must explain the K12 system before listing modules: ${marker}`);
const agentGuide = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8');
assert(agentGuide.includes('docs/ai-install-prompt.md'), 'AGENTS.md must identify the canonical AI installation wording');
assert(agentGuide.includes('tree/main/skills/k12-learning'), 'AGENTS.md must preserve the direct module link convention');

const systemUserGuide = readFileSync(join(learning, 'references/system-user-guide.md'), 'utf8');
for (const marker of [
  '## Wiki 怎么用',
  '第一次：新建，还是接入已有库',
  '把课本、文章、PDF 或笔记入库',
  '把已完成的学习沉淀进去',
  '查询、复用和体检',
  '什么时候需要确认',
]) assert(systemUserGuide.includes(marker), `system user guide missing Wiki user journey: ${marker}`);

const wikiDependency = readFileSync(join(SKILLS, 'llm-wiki/references/Obsidian-Skill-Dependency.md'), 'utf8');
for (const marker of [
  '自动尝试安装唯一允许的官方来源 `kepano/obsidian-skills`',
  'npx skills add https://github.com/kepano/obsidian-skills',
  '网络、DNS、超时、限流或 GitHub 不可达时',
  '继续普通 Markdown/Wikilink 工作流',
]) assert(wikiDependency.includes(marker), `llm-wiki Obsidian dependency contract missing: ${marker}`);
const wikiTests = JSON.parse(readFileSync(join(SKILLS, 'llm-wiki/test-prompts.json'), 'utf8'));
const autoObsidianTest = wikiTests.find(test => test.id === 'obsidian-install-auto-fallback');
assert(autoObsidianTest, 'llm-wiki must regress automatic Obsidian installation fallback');
assert(autoObsidianTest.must_include?.includes('kepano/obsidian-skills') && autoObsidianTest.must_include?.includes('网络失败'), 'Obsidian install regression must cover official source and network fallback');

console.log(`module contract: 4 Product Modules, 61 playbooks, 58 capabilities, 63 source mappings, ${totalTests} behavior cases`);
