#!/usr/bin/env node
// K12 夜间错题产线 —— 扫描学生 inbox，按 k12-learning 内部 playbook 分析错题，晨间产出四件套
// 用法: node /path/to/k12-automation/scripts/nightline/night-run.mjs [--student stu-001]  （无参=全员）
// 数据层 = vault 兼容: students/<id>/{profile.md, inbox/, archive/, outbox/}
//
// 交付版改动（对比 38 自用版）：路径不再硬编码。
//   - 引擎/配置在 k12-automation/scripts/nightline/；学生和日志位于独立数据根。
//   - 数据根 = 环境变量 K12_ROOT，否则当前工作目录。
//   - 教学实现 = config.json 的 learningDir / K12_LEARNING_DIR，否则相邻 k12-learning module。
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync, appendFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hasExternalProcessingAuthorization, hasLocalAuthorization, normalizeProvider, readFrontmatterPrefix } from './authorization.mjs';
import { businessDate } from './business-time.mjs';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const AUTOMATION_DIR = join(ENGINE_DIR, '..', '..');
const ROOT = process.env.K12_ROOT || process.cwd();
const STUDENTS = process.env.K12_STUDENTS_DIR || join(ROOT, 'students');
const LOG_DIR = process.env.K12_LOG_DIR || join(ROOT, 'logs');
const MOCK_LLM = process.env.K12_MOCK_LLM === '1';
const CFG_PATH = join(ENGINE_DIR, 'config.json');
if (!existsSync(CFG_PATH) && !MOCK_LLM) {
  throw new Error('缺 scripts/nightline/config.json：请先从同目录 config.sample.json 复制并填入 OpenAI 兼容端点、key 和模型');
}
const CFG = existsSync(CFG_PATH) ? JSON.parse(readFileSync(CFG_PATH, 'utf8')) : { model: 'mock-llm' };
const LEARNING_DIR = process.env.K12_LEARNING_DIR
  || (CFG.learningDir && CFG.learningDir.trim())
  || join(AUTOMATION_DIR, '..', 'k12-learning');
const PLAYBOOK_ROOT = join(LEARNING_DIR, 'references', 'playbooks');
const today = businessDate();
const LOG = join(LOG_DIR, `night-${today.replace(/-/g, '')}.log`);
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(LOG, line + '\n'); };
const STUDENT_ID = /^[A-Za-z0-9_-]{1,80}$/;

class CliUsageError extends Error {}

function parseCli(argv) {
  if (argv.length === 0) return null;
  if (argv[0] !== '--student') {
    throw new CliUsageError(`未知参数：${argv[0]}。用法：node night-run.mjs [--student <student-id>]`);
  }
  if (argv.length < 2 || !argv[1] || argv[1].startsWith('--')) {
    throw new CliUsageError('缺少 --student 的学生 ID。用法：node night-run.mjs --student <student-id>');
  }
  if (argv.length !== 2) {
    throw new CliUsageError(`不支持额外参数：${argv.slice(2).join(' ')}。只允许无参数或 --student <student-id>`);
  }
  if (!STUDENT_ID.test(argv[1]) || argv[1].startsWith('_')) {
    throw new CliUsageError('学生 ID 非法：只能包含英文、数字、-、_，长度 1-80，且不能以下划线开头');
  }
  return argv[1];
}

// 学科 → 内部 playbook 包（playbook.md + 必需 references 内联）
const PLAYBOOK_MAP = {
  math: ['math/math-error-dna', 'math/math-problem-solving-coach', 'general/correction-notebook'],
  physics: ['physics/physics-error-dna', 'physics/physics-problem-coach', 'general/correction-notebook'],
  chinese: ['chinese/chinese-grammar-tracker', 'chinese/chinese-reading-decoder', 'general/correction-notebook'],
  english: ['english/english-grammar-coach', 'english/english-vocabulary-dna', 'general/correction-notebook'],
  history: ['history/history-error-dna', 'history/history-problem-coach', 'general/correction-notebook'],
  geography: ['geography/geography-error-dna', 'geography/geography-problem-coach', 'general/correction-notebook'],
  politics: ['politics/politics-error-dna', 'politics/politics-framework-coach', 'general/correction-notebook'],
  chemistry: ['chemistry/chemistry-error-dna', 'chemistry/chemistry-reaction-coach', 'general/correction-notebook'],
  biology: ['biology/biology-error-dna', 'biology/biology-process-explainer', 'general/correction-notebook'],
  general: ['general/correction-notebook', 'general/learning-dna'],
};

function loadPlaybookBundle(subject) {
  const dirs = PLAYBOOK_MAP[subject] || PLAYBOOK_MAP.math;
  let bundle = '';
  for (const d of dirs) {
    const sd = join(PLAYBOOK_ROOT, d);
    if (!existsSync(join(sd, 'playbook.md'))) throw new Error(`教学 playbook 不存在: ${d}`);
    bundle += `\n\n##### 教学 playbook：${d} #####\n` + readFileSync(join(sd, 'playbook.md'), 'utf8');
    const refDir = join(sd, 'references');
    if (existsSync(refDir)) {
      for (const f of readdirSync(refDir)) {
        const refPath = join(refDir, f);
        if (!statSync(refPath).isFile()) continue;
        bundle += `\n\n--- ${d}/references/${f} ---\n` + readFileSync(refPath, 'utf8');
      }
    }
  }
  return bundle;
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return out;
}

function latestArchive(dir, n = 3) {
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort().slice(-n);
  return files.map(f => `\n--- 历史档案 ${f} ---\n` + readFileSync(join(dir, f), 'utf8').slice(0, 6000)).join('\n');
}

function profileSummaryForModel(profile) {
  const meta = frontmatter(profile);
  const body = profile.replace(/^---\n[\s\S]*?\n---\s*/, '').trim().slice(0, 4000);
  return `学段：${meta.grade || '未提供'}\n学科：${meta.subjects || '未提供'}\n\n${body || '（无低敏学习摘要）'}`;
}

async function callLLM(system, user) {
  if (MOCK_LLM) {
    return `<<<DIAGNOSIS>>>
# Mock 错因诊断

基于现有证据定位主错因，引用学生原步骤，不臆造长期弱项。
<<<ARCHIVE>>>
---
date: ${today}
subject: mock
topic: mock-regression
error_type: evidence-based
recurrence_count: 1
---

Mock 错题档案。
<<<PROBLEMS>>>
1. Mock 变式题一。
2. Mock 变式题二。
3. Mock 变式题三。
<<<SOLUTIONS>>>
1. Mock 解答一。
2. Mock 解答二。
3. Mock 解答三。
<<<END>>>`;
  }
  const res = await fetch(`${CFG.apibase}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CFG.key}` },
    body: JSON.stringify({ model: CFG.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function section(text, name) {
  const re = new RegExp(`<<<${name}>>>\\s*([\\s\\S]*?)(?=<<<[A-Z]+>>>|$)`);
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

async function processItem(stuDir, stuId, itemPath) {
  const item = readFileSync(itemPath, 'utf8');
  if (item.length > 20000) throw new Error('错题文件超过 20000 字符，请只保留当前题目、学生步骤和必要背景');
  const fm = frontmatter(item);
  const subject = fm.subject || 'math';
  const profilePath = join(stuDir, 'profile.md');
  const profileMeta = existsSync(profilePath) ? readFrontmatterPrefix(profilePath) : {};
  if (!hasLocalAuthorization(profileMeta)) throw new Error('学生档案缺少有效的结构化本地授权记录');
  if (!MOCK_LLM && !hasExternalProcessingAuthorization(profileMeta, CFG.apibase)) {
    throw new Error(`未授权向当前模型服务 ${normalizeProvider(CFG.apibase) || '（配置无效）'} 发送学习数据，或授权范围/提供方已变化`);
  }
  const profile = readFileSync(profilePath, 'utf8');
  const profileSummary = profileSummaryForModel(profile);
  const history = latestArchive(join(stuDir, 'archive'));
  const playbooks = loadPlaybookBundle(subject);

  const system = `你是夜间批处理模式下的 K12 教学引擎，装载了以下内部 playbook，必须严格按其方法论、错因分类体系和红线工作。注意：这是离线批处理，没有对话机会，所以 playbook 里"先追问"的环节改为"列出你最想问学生的 2 个追问 + 基于现有证据的最可能答案"。运行前已校验结构化本地授权；真实模型模式还校验了外部处理提供方、范围和日期。只处理当前错题所需数据。Playbook：${playbooks}`;

  const user = `# 学生低敏学习摘要\n${profileSummary}\n\n# 最近 3 份错题档案（每份最多 6000 字符，用于判断是否反复）\n${history || '（暂无历史）'}\n\n# 今晚提交的错题\n${item}\n\n# 任务\n按技能方法论分析，严格输出以下四节，每节以独立一行的标记开头：\n<<<DIAGNOSIS>>>\n错因诊断报告（给学生和家长看的 Markdown：主错因分类+证据引用学生原步骤+根因一句话+是否触发顽固弱项专项，触发则给专项突破方案）\n<<<ARCHIVE>>>\n一条标准错题档案（Markdown，以 --- 开头的 frontmatter 含 date/subject/topic/error_type/recurrence_count 字段，正文按技能的档案记录模板）\n<<<PROBLEMS>>>\n针对根因的变式训练题 3-5 道（Markdown，难度梯度从直击根因到迁移，注明每题考什么）\n<<<SOLUTIONS>>>\n上述变式题的完整解答与讲解（Markdown，讲解要点名学生的老毛病在哪一步会复发）\n<<<END>>>`;

  log(`  调用 ${CFG.model}（${subject}，playbook 包 ${Math.round(playbooks.length / 1024)}KB）...`);
  const out = await callLLM(system, user);

  const stamp = today;
  const slug = basename(itemPath).replace(/\.(md|txt)$/, '');
  const outDir = join(stuDir, 'outbox', stamp);
  mkdirSync(outDir, { recursive: true });
  const pieces = { DIAGNOSIS: '错因诊断', PROBLEMS: '变式训练题', SOLUTIONS: '答案与讲解' };
  for (const [k, label] of Object.entries(pieces)) {
    const c = section(out, k);
    if (!c) throw new Error(`输出缺少 ${k} 节`);
    writeFileSync(join(outDir, `${slug}-${label}.md`), c + '\n');
  }
  const arch = section(out, 'ARCHIVE');
  if (!arch) throw new Error('输出缺少 ARCHIVE 节');
  const archDir = join(stuDir, 'archive');
  mkdirSync(archDir, { recursive: true });
  const seq = readdirSync(archDir).filter(f => f.startsWith(`错题-${stamp.replace(/-/g, '')}`)).length + 1;
  writeFileSync(join(archDir, `错题-${stamp.replace(/-/g, '')}-${String(seq).padStart(3, '0')}.md`), arch + '\n');

  const doneDir = join(stuDir, 'inbox', 'processed');
  mkdirSync(doneDir, { recursive: true });
  renameSync(itemPath, join(doneDir, `${stamp}_${basename(itemPath)}`));
  log(`  ✓ ${slug} 完成 → outbox/${stamp}/`);
  return { slug, subject };
}

async function main() {
  const onlyStu = parseCli(process.argv.slice(2));
  if (onlyStu) {
    const studentPath = join(STUDENTS, onlyStu);
    if (!existsSync(studentPath) || !statSync(studentPath).isDirectory()) {
      throw new CliUsageError(`指定学生不存在：${onlyStu}`);
    }
  }
  mkdirSync(LOG_DIR, { recursive: true });
  let failures = 0;
  const students = readdirSync(STUDENTS).filter(s =>
    !s.startsWith('_') && (!onlyStu || s === onlyStu) && statSync(join(STUDENTS, s)).isDirectory());
  log(`夜间产线启动，学生数 ${students.length}`);
  for (const stu of students) {
    const stuDir = join(STUDENTS, stu);
    const inbox = join(stuDir, 'inbox');
    if (!existsSync(inbox)) continue;
    const items = readdirSync(inbox).filter(f => /\.(md|txt)$/.test(f) && statSync(join(inbox, f)).isFile());
    if (!items.length) { log(`${stu}: inbox 空，跳过`); continue; }
    const profilePath = join(stuDir, 'profile.md');
    const profileMeta = existsSync(profilePath) ? readFrontmatterPrefix(profilePath) : {};
    if (!hasLocalAuthorization(profileMeta)) {
      log(`${stu}: ✗ 学生档案缺少有效的结构化本地授权记录，跳过 ${items.length} 件`);
      failures += items.length;
      continue;
    }
    if (!MOCK_LLM && !hasExternalProcessingAuthorization(profileMeta, CFG.apibase)) {
      log(`${stu}: ✗ 未授权向当前模型服务发送学习数据，或授权范围/提供方已变化；跳过 ${items.length} 件`);
      failures += items.length;
      continue;
    }
    log(`${stu}: ${items.length} 件待处理`);
    const done = [];
    for (const f of items) {
      try { done.push(await processItem(stuDir, stu, join(inbox, f))); }
      catch (e) { failures++; log(`  ✗ ${f} 失败: ${e.message}`); }
    }
    if (done.length) {
      const outDir = join(stuDir, 'outbox', today);
      const brief = `# ${today} 晨报 — ${stu}\n\n昨晚处理 ${done.length} 件：\n` +
        done.map(d => `- ${d.slug}（${d.subject}）：错因诊断 / 变式训练题 / 答案与讲解 三件已出`).join('\n') +
        `\n\n建议使用顺序：先读"错因诊断"，再做"变式训练题"（不要先看答案），做完对照"答案与讲解"。\n`;
      writeFileSync(join(outDir, '晨报.md'), brief);
      log(`${stu}: 晨报已生成`);
    }
  }
  if (failures) {
    log(`夜间产线收工：${failures} 件失败`);
    process.exitCode = 1;
  } else {
    log('夜间产线收工');
  }
}

main().catch(e => {
  const message = `FATAL: ${e.message}`;
  console.error(message);
  if (!(e instanceof CliUsageError)) {
    try {
      mkdirSync(LOG_DIR, { recursive: true });
      appendFileSync(LOG, `[${new Date().toISOString()}] ${message}\n`);
    } catch { /* stderr 已提供错误；不要用日志失败掩盖原始异常 */ }
  }
  process.exitCode = 1;
});
