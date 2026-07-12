#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEARNING_ROOT = join(ROOT, 'skills/k12-learning');
const MODULE_NAMES = ['k12-learning', 'llm-wiki', 'k12-automation', 'k12-skill-studio'];
const ACTIVE_ROOTS = MODULE_NAMES.flatMap((moduleName) => {
  const moduleRoot = join(ROOT, 'skills', moduleName);
  return [join(moduleRoot, 'SKILL.md'), join(moduleRoot, 'references')];
});
const REAL_REMINDER_ACTION = /(?:创建|设置|设定|安排|生成|提交|发送|排程|调度|推送)[^，。；\n]{0,20}提醒|提醒(?:创建|设置|设定|安排|生成|发送|排程|调度|推送|请求|复测)/;
const LEGACY_SKILL_CONTROL = /(?:旧|目标|当前|对应|其他|下一个|某个)\s*Skill|跨\s*Skill|Skill\s*(?:菜单|路由|入口|交接|联动|协调器)|(?:调用|激活|转交|交接|直达|选择|路由(?:到)?|切换到|推送(?:给|到)|回写(?:给|到))[^，。；\n]{0,24}\bSkill\b(?!-)/i;
const INTERNAL_METHOD_ACTOR = '(?:方法|教练|训练师|解释器|DNA(?:系统)?|错题本|学习复盘|学习计划|康奈尔笔记|费曼测试)';
const LEGACY_METHOD_MESSAGE_FLOW = new RegExp(
  `${INTERNAL_METHOD_ACTOR}[^，。；,\\n]{0,28}(?:推送(?:到|至|给)|回写(?:至|到|给)?|移交给|转发给)|(?:推送|回写(?:至|到|给)?|移交给|转发给)[^，。；,\\n]{0,28}${INTERNAL_METHOD_ACTOR}|向[^，。；,\\n]{0,12}${INTERNAL_METHOD_ACTOR}[^，。；,\\n]{0,16}推送`,
);
const LEGACY_METHOD_LINKING = new RegExp(
  `(?:联动|协同)[^，。；,\\]\\n]{0,28}${INTERNAL_METHOD_ACTOR}|${INTERNAL_METHOD_ACTOR}[^，。；,\\]\\n]{0,28}(?:联动|协同)`,
);
const LEGACY_HANDOFF_CONTROL = /(?:记录|任务|数据|摘要|结果|状态|请求|方法|Skill|playbook)[^，。；,\n]{0,20}(?:转交|交接|移交)[^，。；,\n]{0,28}(?:记录|任务|数据|摘要|结果|状态|请求|方法|Skill|playbook|教练|训练师|解释器|DNA|错题本)?|(?:转交|交接|移交)[^，。；,\n]{0,28}(?:记录|任务|数据|摘要|结果|状态|请求|方法|Skill|playbook|教练|训练师|解释器|DNA|错题本)/i;
const NEGATED_HANDOFF_CONTROL = /(?:不|不再|不得|不会|不能|没有|无需|禁止|杜绝|严禁|避免)[^，。；,\n]{0,16}(?:转交|交接|移交)/;
const LEGACY_COORDINATOR_CONTROL = /(?:Skill|方法|playbook|路由|任务|记录|数据|系统|联动)[^，。；,\n]{0,16}协调器|协调器[^，。；,\n]{0,20}(?:Skill|方法|playbook|路由|任务|记录|数据|系统|联动)/i;
const LEGACY_ENGLISH_HANDOFF = /handover(?:Type|[_-](?:protocol|record|task|data|state))|(?:protocol|record|task|data|state)[_-]?handover|handoff(?:Type|[_-](?:protocol|record|task|data|state))|skill-coordinator/i;
const LEGACY_CROSS_SKILL_CONTROL = /跨\s*(?:Skill|技能)[^，。；,\n]{0,20}(?:共享|传递|路由|调用|写入|读取|交接|转交)|(?:共享|传递|路由|调用|写入|读取|交接|转交)[^，。；,\n]{0,20}跨\s*(?:Skill|技能)/i;
const LEGACY_CHINESE_SKILL_IDENTITY = /(?:本|此)技能|技能(?:协调|调度)/;
const REMOVED_REMINDER_IDENTITY = /im-reminder|IM\s*智能?\s*提醒/i;
const BYPASS_REMINDER_RUNTIME = /(?:自动转入|启动|触发)[^，。；\n]{0,20}(?:五轮提醒|提醒系统)|(?:五轮提醒|提醒系统)[^，。；\n]{0,20}(?:自动转入|启动|触发)/;
const NEGATED_REMINDER_ACTION = /(?:不|不得|禁止|不会|未授权|未获授权)[^，。；\n]{0,32}(?:创建|设置|设定|安排|生成|提交|发送|排程|调度|推送)?[^，。；\n]{0,12}提醒/;

function rejectsLearningLine(line) {
  return /^depends_on\s*:/i.test(line)
    || LEGACY_SKILL_CONTROL.test(line)
    || LEGACY_METHOD_MESSAGE_FLOW.test(line)
    || LEGACY_METHOD_LINKING.test(line)
    || (LEGACY_HANDOFF_CONTROL.test(line) && !NEGATED_HANDOFF_CONTROL.test(line))
    || LEGACY_COORDINATOR_CONTROL.test(line)
    || LEGACY_ENGLISH_HANDOFF.test(line)
    || LEGACY_CROSS_SKILL_CONTROL.test(line)
    || LEGACY_CHINESE_SKILL_IDENTITY.test(line)
    || REMOVED_REMINDER_IDENTITY.test(line);
}

for (const [line, expected] of [
  ['This skill develops several listening skills.', false],
  ['训练听力微技能，并比较不同解题技能。', false],
  ['用交接球权的比喻解释团队配合。', false],
  ['业务处理完成后回写数据库状态。', false],
  ['depends_on: math-error-dna', true],
  ['把记录交接给数学方法。', true],
  ['内部 playbook 不彼此交接或传递中间消息。', false],
  ['禁止把记录移交给其他系统。', false],
  ['禁止把记录移交给错题本。', true],
  ['A方法推送给B方法。', true],
  ['A方法回写给B方法。', true],
  ['IM智能提醒负责五轮复习。', true],
]) {
  assert.equal(rejectsLearningLine(line), expected, `semantic pattern self-test failed: ${line}`);
}

function findRuntimeMarkdown(dir) {
  if (!statSync(dir).isDirectory()) return dir.endsWith('.md') ? [dir] : [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findRuntimeMarkdown(path));
    else if (entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

const runtimeMarkdown = ACTIVE_ROOTS.flatMap(findRuntimeMarkdown).sort();
const violations = [];

function report(file, lineNumber, rule, line) {
  violations.push({
    file: relative(ROOT, file),
    lineNumber,
    rule,
    excerpt: line.trim().slice(0, 180),
  });
}

for (const file of runtimeMarkdown) {
  const isLearning = file.startsWith(`${LEARNING_ROOT}/`);
  const isPlaybookRuntime = file.includes(`${join('references', 'playbooks')}/`);
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/^depends_on\s*:/i.test(line)) {
      report(file, lineNumber, 'frontmatter must not declare depends_on', line);
    }

    if (isLearning && LEGACY_SKILL_CONTROL.test(line)) {
      report(file, lineNumber, 'active instructions must not restore old K12 Skill routing or control semantics', line);
    }

    if (isLearning && LEGACY_CHINESE_SKILL_IDENTITY.test(line)) {
      report(file, lineNumber, 'active instructions must not describe an internal playbook as a standalone 技能 or restore skill coordination', line);
    }

    if (
      (LEGACY_HANDOFF_CONTROL.test(line) && !NEGATED_HANDOFF_CONTROL.test(line))
      || LEGACY_COORDINATOR_CONTROL.test(line)
      || LEGACY_ENGLISH_HANDOFF.test(line)
    ) {
      report(file, lineNumber, 'runtime references must not restore handoff or coordinator control semantics', line);
    }

    if (LEGACY_CROSS_SKILL_CONTROL.test(line)) {
      report(file, lineNumber, 'runtime references must distinguish internal composition from explicit cross-module transfer', line);
    }

    if (isLearning && LEGACY_METHOD_MESSAGE_FLOW.test(line)) {
      report(file, lineNumber, 'internal methods must contribute to one k12-learning result, not push or write back messages', line);
    }

    if (isLearning && LEGACY_METHOD_LINKING.test(line)) {
      report(file, lineNumber, 'named methods must be composed by k12-learning in one result, not linked as independent actors', line);
    }

    if (isLearning && REMOVED_REMINDER_IDENTITY.test(line)) {
      report(file, lineNumber, 'reminders cross the k12-automation seam; the removed reminder Skill must not appear', line);
    }

    if (isLearning && BYPASS_REMINDER_RUNTIME.test(line) && !line.includes('k12-automation')) {
      report(file, lineNumber, 'learning content must not start an internal reminder system; use the k12-automation seam', line);
    }

    if (
      isLearning
      && isPlaybookRuntime
      && REAL_REMINDER_ACTION.test(line)
      && !NEGATED_REMINDER_ACTION.test(line)
      && !line.includes('k12-automation')
    ) {
      report(file, lineNumber, 'real reminder actions must explicitly cross the k12-automation seam', line);
    }
  });
}

if (violations.length > 0) {
  console.error(`playbook semantics: ${violations.length} violation(s)`);
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.lineNumber} [${violation.rule}] ${violation.excerpt}`,
    );
  }
  process.exit(1);
}

console.log(`playbook semantics: ${runtimeMarkdown.length} active Markdown files checked across 4 Product Modules`);
