#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PLAYBOOK_ROOT = join(ROOT, 'skills/k12-learning/references/playbooks');
const REAL_REMINDER_ACTION = /(?:创建|设置|设定|安排|生成|提交|发送|排程|调度|推送)[^，。；\n]{0,20}提醒|提醒(?:创建|设置|设定|安排|生成|发送|排程|调度|推送|请求|复测)/;

function findPlaybooks(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findPlaybooks(path));
    else if (entry.name === 'playbook.md') files.push(path);
  }
  return files;
}

const playbooks = findPlaybooks(PLAYBOOK_ROOT).sort();
const violations = [];

function report(file, lineNumber, rule, line) {
  violations.push({
    file: relative(ROOT, file),
    lineNumber,
    rule,
    excerpt: line.trim().slice(0, 180),
  });
}

for (const file of playbooks) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/^depends_on\s*:/i.test(line)) {
      report(file, lineNumber, 'frontmatter must not declare depends_on', line);
    }

    if (/\bskill\b/i.test(line)) {
      report(file, lineNumber, 'internal playbooks must use method/composition language, not singular Skill', line);
    }

    if (line.replaceAll('微技能', '').includes('技能')) {
      report(file, lineNumber, 'internal capability wording must use 方法; 微技能 is the only pedagogical exception', line);
    }

    if (/转交|交接|协调器|handover|handoff/i.test(line)) {
      report(file, lineNumber, 'legacy handoff/coordinator semantics are forbidden; use 切换到 or 内部组合', line);
    }

    if (/调用.{0,12}方法|激活.{0,12}方法|交给.{0,20}方法|方法联动/.test(line)) {
      report(file, lineNumber, 'legacy invocation wording is forbidden; use 采用、切换到 or 内部组合', line);
    }

    if (/im-reminder|IM\s*提醒|提醒(?:方法|能力|系统)/i.test(line)) {
      report(file, lineNumber, 'reminders are a k12-automation module seam, not an internal learning method', line);
    }

    if (REAL_REMINDER_ACTION.test(line) && !line.includes('k12-automation')) {
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

console.log(`playbook semantics: ${playbooks.length} k12-learning playbooks checked`);
