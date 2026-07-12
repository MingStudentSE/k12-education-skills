#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  loadNightAnalysisContract,
  parseNightAnalysisOutput,
  validateNightAnalysisRequest,
} from '../skills/k12-automation/scripts/nightline/contract-runtime.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const AUTO = join(ROOT, 'skills/k12-automation');
const LEARNING = join(ROOT, 'skills/k12-learning');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = path => readFileSync(path, 'utf8');
const expectFailure = (fn, pattern, message) => {
  let error = null;
  try { fn(); }
  catch (caught) { error = caught; }
  assert(error && pattern.test(error.message), `${message}: ${error?.message || '没有失败'}`);
};

const nightPath = join(AUTO, 'scripts/nightline/night-run.mjs');
const night = read(nightPath);
for (const call of ['loadNightAnalysisContract(LEARNING_ADAPTER)', 'validateNightAnalysisRequest(adapter, request)', 'parseNightAnalysisOutput(adapter, out)']) {
  assert(night.includes(call), `night-run 未经过统一 runtime seam：${call}`);
}
assert(night.includes('loadRuntimeConfig({ mock: MOCK_LLM })'), 'night-run 未使用共享 config normalization 或 Mock 语义');
assert(night.includes('publishNightAnalysisArtifacts({'), 'night-run 未经过按项 staging/publish seam');
const requestIndex = night.indexOf('validateNightAnalysisRequest(adapter, request)');
const transportIndex = night.indexOf('const out = await callLLM(system, user, subject)');
const outputIndex = night.indexOf('parseNightAnalysisOutput(adapter, out)');
assert(requestIndex < transportIndex && transportIndex < outputIndex, 'request/transport/output seam 顺序错误');
assert((night.match(/await callLLM\(/g) || []).length === 1, 'Mock 和真实路径分裂成多个 transport 调用');
for (const forbidden of ["'references', 'playbooks'", 'PLAYBOOK_MAP', 'K12_LEARNING_DIR', 'learningDir']) {
  assert(!night.includes(forbidden), `night-run 泄漏实现或 Learning State：${forbidden}`);
}
assert(!/join\([^\n]*['"]profile\.md['"]\)|readFileSync\([^\n]*profile\.md/.test(night), 'night-run 读取 Learning profile');

const authorization = read(join(AUTO, 'scripts/nightline/authorization.mjs'));
assert(authorization.includes('loadJsonSchema(AUTOMATION_STATE_SCHEMA_PATH'), 'Automation runtime 没有加载自己的 state schema');
assert(authorization.includes("assertJsonSchema(state, automationStateSchema, 'Automation state')"), 'Automation runtime 没有按 schema 校验 state');
assert(!/join\([^\n]*['"]profile\.md['"]\)|readFrontmatterPrefix|source:\s*['"]legacy-profile/.test(authorization), 'steady-state authorization 仍读取 legacy profile');
const migration = read(join(AUTO, 'scripts/nightline/migrate-legacy-authorization.mjs'));
assert(migration.includes('--audit') && migration.includes('exit_ready') && migration.includes('--confirm'), 'legacy migration 缺少显式入口或 exit criterion');
assert(!/from\s+['"][^'"]*migrate-legacy-authorization|import\([^)]*migrate-legacy-authorization/.test(`${night}\n${authorization}`), 'steady-state runtime 依赖 legacy migration');
const server = read(join(AUTO, 'scripts/nightline/server.mjs'));
assert(server.includes('loadRuntimeConfig()'), 'server 未使用与 night-run 相同的 config normalization');
const runtimeConfig = read(join(AUTO, 'scripts/nightline/runtime-config.mjs'));
assert(runtimeConfig.includes('if (mock)') && runtimeConfig.includes("model: 'mock-llm'"), '共享 config loader 丢失 Mock 无凭据模式');

const learningSchemas = [
  join(LEARNING, 'references/playbooks/general/learning-dna/schemas/dna-profile.schema.json'),
  join(LEARNING, 'references/playbooks/general/student-quick-assessment/schemas/intake-persona.schema.json'),
];
for (const path of learningSchemas) {
  const text = read(path);
  assert(!/reminderConsent|crossSkillSharing/.test(text), `${path} 仍由 Learning 持有 Automation/cross-module 授权字段`);
}

const adapterPath = join(LEARNING, 'references/adapters/night-analysis-v1.md');
const adapter = read(adapterPath);
assert(/^---\n[\s\S]*?adapter_contract: k12-learning\/night-analysis[\s\S]*?contract_version: v1[\s\S]*?request_schema: \.\.\/\.\.\/schemas\/night-analysis-request-v1\.schema\.json[\s\S]*?output_schema: \.\.\/\.\.\/schemas\/night-analysis-output-v1\.schema\.json[\s\S]*?\n---/.test(adapter), 'Learning adapter identity/version/schema references 缺失');
const contract = loadNightAnalysisContract(adapterPath);
const request = {
  contract_version: 'v1',
  business_date: '2026-07-12',
  subject: 'math',
  learning_summary: { grade: '未提供', subjects: '未提供', notes: 'Automation v1 未读取 Learning State' },
  recent_archives: [],
  current_mistake: '1 + 1 = 3',
};
validateNightAnalysisRequest(contract, request);
expectFailure(
  () => validateNightAnalysisRequest(contract, { ...request, authorization: { authorized: true } }),
  /不允许额外字段/,
  'request schema 接受了授权状态',
);
const output = `<<<DIAGNOSIS>>>
# 错因诊断
- 主错因：计算过程
<<<ARCHIVE>>>
---
date: 2026-07-12
subject: math
topic: 加法
error_type: 计算过程
recurrence_count: 1
---
当前证据摘要。
<<<PROBLEMS>>>
1. 1 + 2 = ?
<<<SOLUTIONS>>>
1. 3
<<<END>>>`;
parseNightAnalysisOutput(contract, output);
expectFailure(
  () => parseNightAnalysisOutput(contract, output.replace('recurrence_count: 1', 'recurrence_count: 0')),
  /小于 1/,
  'output schema 接受了非法 archive 字段',
);
expectFailure(
  () => parseNightAnalysisOutput(contract, output.replace('<<<SOLUTIONS>>>', '')),
  /SOLUTIONS/,
  'output schema 路径接受了缺节输出',
);

const deletionRoot = mkdtempSync(join(tmpdir(), 'k12-adapter-deletion-'));
try {
  const copiedAdapter = join(deletionRoot, 'learning/references/adapters/night-analysis-v1.md');
  const copiedSchemas = join(deletionRoot, 'learning/schemas');
  mkdirSync(dirname(copiedAdapter), { recursive: true });
  mkdirSync(copiedSchemas, { recursive: true });
  copyFileSync(adapterPath, copiedAdapter);
  for (const name of ['night-analysis-request-v1.schema.json', 'night-analysis-output-v1.schema.json']) {
    copyFileSync(join(LEARNING, 'schemas', name), join(copiedSchemas, name));
  }
  loadNightAnalysisContract(copiedAdapter);

  const requestCopy = join(copiedSchemas, 'night-analysis-request-v1.schema.json');
  rmSync(requestCopy);
  expectFailure(() => loadNightAnalysisContract(copiedAdapter), /缺少 Learning request schema/, '删除 request schema 没有让 runtime 失败');
  copyFileSync(join(LEARNING, 'schemas/night-analysis-request-v1.schema.json'), requestCopy);

  const outputCopy = join(copiedSchemas, 'night-analysis-output-v1.schema.json');
  rmSync(outputCopy);
  expectFailure(() => loadNightAnalysisContract(copiedAdapter), /缺少 Learning output schema/, '删除 output schema 没有让 runtime 失败');
  copyFileSync(join(LEARNING, 'schemas/night-analysis-output-v1.schema.json'), outputCopy);

  writeFileSync(copiedAdapter, adapter.replace('<<<SOLUTIONS>>>', ''));
  expectFailure(() => loadNightAnalysisContract(copiedAdapter), /缺少规定的输出标记 SOLUTIONS/, '删除 adapter body 关键内容没有让 runtime 失败');

  const markerOnly = `---
adapter_contract: k12-learning/night-analysis
contract_version: v1
request_schema: ../../schemas/night-analysis-request-v1.schema.json
output_schema: ../../schemas/night-analysis-output-v1.schema.json
policy_sections: input-boundary,analysis-task,output-contract,red-lines
policy_rules: evidence-first,single-primary-cause,history-threshold-3,adaptive-practice,mastery-criterion,no-state-inference,no-fake-side-effects
---
<<<DIAGNOSIS>>>
<<<ARCHIVE>>>
<<<PROBLEMS>>>
<<<SOLUTIONS>>>
<<<END>>>
`;
  writeFileSync(copiedAdapter, markerOnly);
  expectFailure(() => loadNightAnalysisContract(copiedAdapter), /policy section/, '仅保留 frontmatter 与 markers 的空壳 adapter 被接受');

  writeFileSync(copiedAdapter, adapter.replace('只选择一个主错因', '选择一个主错因'));
  expectFailure(() => loadNightAnalysisContract(copiedAdapter), /缺少关键行为：只选择一个主错因/, '删除单一主错因规则没有让 runtime 失败');
} finally {
  rmSync(deletionRoot, { recursive: true, force: true });
}

const config = JSON.parse(read(join(AUTO, 'scripts/nightline/config.sample.json')));
assert(Object.hasOwn(config, 'learningAdapter') && !Object.hasOwn(config, 'learningDir'), 'sample config 暴露错误 Learning seam');
assert(!existsSync(join(AUTO, 'assets/student-template/profile.md')), 'Automation template 不得包含 Learning profile');
const templateState = JSON.parse(read(join(AUTO, 'assets/student-template/automation/state.json')));
assert(templateState.schema_version === 'k12-automation-state/v1', 'Automation template state version mismatch');
assert(templateState.authorization.local.authorized === false && templateState.authorization.external_processing.authorized === false, 'Automation template 必须默认无授权');

for (const name of ['k12-nightline-guide.md', 'k12-nightline-contract.md']) {
  assert(read(join(ROOT, 'docs', name)) === read(join(AUTO, 'references/nightline', name)), `${name} 与打包 reference 漂移`);
}

console.log('automation seam: state ownership + runtime schemas + shared Mock/real path + adapter deletion tests + explicit legacy exit passed');
