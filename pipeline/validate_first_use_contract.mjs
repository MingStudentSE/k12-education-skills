#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFileSync(join(ROOT, relative), 'utf8');
const tests = JSON.parse(read('skills/k12-learning/test-prompts.json'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requireAll(relative, fragments) {
  const text = read(relative);
  for (const fragment of fragments) {
    assert(text.includes(fragment), `${relative}: missing first-use contract fragment: ${fragment}`);
  }
  return text;
}

function route(id) {
  const test = tests.find(item => item.id === id);
  assert(test, `missing first-use regression case: ${id}`);
  assert(test.expected_route, `${id}: missing expected_route`);
  return test.expected_route;
}

function sameMembers(actual = [], expected = []) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

const artifact = route('first-visit-with-artifact');
assert(artifact.mode === 'COMPOSE', 'first artifact visit must COMPOSE');
assert(artifact.primaryPlaybook === 'student-quick-assessment', 'first artifact visit must start with quick assessment');
assert(sameMembers(artifact.supportingPlaybooks, ['learning-dna', 'math-problem-solving-coach']), 'first artifact visit must build DNA and continue the real math task');

const onboarding = route('first-use-onboarding');
assert(onboarding.mode === 'COMPOSE', 'first-use onboarding must COMPOSE');
assert(onboarding.primaryPlaybook === 'student-quick-assessment', 'first-use onboarding must start with quick assessment');
assert(sameMembers(onboarding.supportingPlaybooks, ['learning-dna', 'system-guide']), 'first-use onboarding must combine DNA and concise guidance');

const overview = route('system-guide-capability-overview');
assert(overview.mode === 'DIRECT' && overview.primaryPlaybook === 'system-guide', 'ordinary capability overview must remain a direct system-guide route');

for (const id of ['first-use-rejects-comprehensive-assessment', 'first-use-dna-before-persistence']) {
  assert(tests.some(item => item.id === id), `missing first-use behavior case: ${id}`);
}

const quickAssessment = requireAll(
  'skills/k12-learning/references/playbooks/general/student-quick-assessment/playbook.md',
  ['一份近期代表性材料', '1–3 个短测评动作', '初版学习 DNA', '立即进入真实任务', '3–5 分钟', '最后询问是否保存'],
);
assert(!quickAssessment.includes('信息稀薄走完整道'), 'quick assessment must not restore the full-intake branch');
assert(!quickAssessment.includes('七字段 intake 清单'), 'quick assessment must not restore the seven-field startup checklist');

requireAll(
  'skills/k12-learning/references/system-user-guide.md',
  ['从手头选一份真实材料', '3–5 分钟快速测评', '不做全面测评', '初版学习 DNA', '马上用这份材料带我完成一个真实学习动作', '跨会话保存画像'],
);
requireAll(
  'skills/k12-learning/references/playbooks/general/learning-dna/playbook.md',
  ['会话内初版', '用真实材料快速取证', '立即完成真实动作', '再决定保存'],
);
requireAll(
  'SECURITY_BASELINE.md',
  ['无持久化的快速定位', '未经用户明确同意，不建立跨会话档案'],
);

console.log('first-use contract: material -> 3–5 minute quick assessment -> session DNA -> real task -> optional persistence passed');
