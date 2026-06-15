#!/usr/bin/env node
// K12 夜间错题产线 —— 扫描学生 inbox，按当前仓库的学科技能分析错题，晨间产出四件套
// 用法: node engine/night-run.mjs [--student stu-001]  （无参=全员）
// 数据层 = vault 兼容: students/<id>/{profile.md, inbox/, archive/, outbox/}
//
// 交付版改动（对比 38 自用版）：路径不再硬编码。
//   - 引擎/配置在 engine/ 目录；学生、日志、技能在包根目录。
//   - 包根 = 环境变量 K12_ROOT，否则 engine/ 的上级目录。
//   - 技能目录 = config.json 的 skillsDir，否则 <包根>/skills。
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync, appendFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.K12_ROOT || join(ENGINE_DIR, '..');
const STUDENTS = process.env.K12_STUDENTS_DIR || join(ROOT, 'students');
const LOG_DIR = process.env.K12_LOG_DIR || join(ROOT, 'logs');
const MOCK_LLM = process.env.K12_MOCK_LLM === '1';
const CFG_PATH = join(ENGINE_DIR, 'config.json');
if (!existsSync(CFG_PATH) && !MOCK_LLM) {
  throw new Error('缺 engine/config.json：请先复制 engine/config.sample.json 并填入 OpenAI 兼容端点、key 和模型');
}
const CFG = existsSync(CFG_PATH) ? JSON.parse(readFileSync(CFG_PATH, 'utf8')) : { model: 'mock-llm' };
const REPO = CFG.skillsDir && CFG.skillsDir.trim() ? CFG.skillsDir : join(ROOT, 'skills');
const today = new Date().toISOString().slice(0, 10);
const LOG = join(LOG_DIR, `night-${today.replace(/-/g, '')}.log`);
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(LOG, line + '\n'); };

// 学科 → 技能包（SKILL.md + 全部 references 内联）
const SKILL_MAP = {
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

function loadSkillBundle(subject) {
  const dirs = SKILL_MAP[subject] || SKILL_MAP.math;
  let bundle = '';
  for (const d of dirs) {
    const sd = join(REPO, d);
    if (!existsSync(join(sd, 'SKILL.md'))) throw new Error(`技能包不存在或缺 SKILL.md: ${d}`);
    bundle += `\n\n##### 技能定义：${d} #####\n` + readFileSync(join(sd, 'SKILL.md'), 'utf8');
    const refDir = join(sd, 'references');
    if (existsSync(refDir)) {
      for (const f of readdirSync(refDir)) {
        bundle += `\n\n--- ${d}/references/${f} ---\n` + readFileSync(join(refDir, f), 'utf8');
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

function latestArchive(dir, n = 6) {
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort().slice(-n);
  return files.map(f => `\n--- 历史档案 ${f} ---\n` + readFileSync(join(dir, f), 'utf8')).join('\n');
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
  const fm = frontmatter(item);
  const subject = fm.subject || 'math';
  const profile = existsSync(join(stuDir, 'profile.md')) ? readFileSync(join(stuDir, 'profile.md'), 'utf8') : '（无画像）';
  const history = latestArchive(join(stuDir, 'archive'));
  const skills = loadSkillBundle(subject);

  const system = `你是夜间批处理模式下的 K12 教学引擎，装载了以下教学技能，必须严格按技能的方法论、错因分类体系和红线工作。注意：这是离线批处理，没有对话机会，所以技能里"先追问"的环节改为"列出你最想问学生的 2 个追问 + 基于现有证据的最可能答案"。学生档案已获监护人书面授权（授权记录在产线协议中），可以正常写档案。技能定义：${skills}`;

  const user = `# 学生画像\n${profile}\n\n# 历史错题档案（用于判断顽固弱项，同类错误≥3次必须触发专项突破）\n${history || '（暂无历史）'}\n\n# 今晚提交的错题\n${item}\n\n# 任务\n按技能方法论分析，严格输出以下四节，每节以独立一行的标记开头：\n<<<DIAGNOSIS>>>\n错因诊断报告（给学生和家长看的 Markdown：主错因分类+证据引用学生原步骤+根因一句话+是否触发顽固弱项专项，触发则给专项突破方案）\n<<<ARCHIVE>>>\n一条标准错题档案（Markdown，以 --- 开头的 frontmatter 含 date/subject/topic/error_type/recurrence_count 字段，正文按技能的档案记录模板）\n<<<PROBLEMS>>>\n针对根因的变式训练题 3-5 道（Markdown，难度梯度从直击根因到迁移，注明每题考什么）\n<<<SOLUTIONS>>>\n上述变式题的完整解答与讲解（Markdown，讲解要点名学生的老毛病在哪一步会复发）\n<<<END>>>`;

  log(`  调用 ${CFG.model}（${subject}，技能包 ${Math.round(skills.length / 1024)}KB）...`);
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
  mkdirSync(LOG_DIR, { recursive: true });
  const onlyStu = process.argv.includes('--student') ? process.argv[process.argv.indexOf('--student') + 1] : null;
  const students = readdirSync(STUDENTS).filter(s => !s.startsWith('_') && (!onlyStu || s === onlyStu));
  log(`夜间产线启动，学生数 ${students.length}`);
  for (const stu of students) {
    const stuDir = join(STUDENTS, stu);
    const inbox = join(stuDir, 'inbox');
    if (!existsSync(inbox)) continue;
    const items = readdirSync(inbox).filter(f => /\.(md|txt)$/.test(f) && statSync(join(inbox, f)).isFile());
    if (!items.length) { log(`${stu}: inbox 空，跳过`); continue; }
    log(`${stu}: ${items.length} 件待处理`);
    const done = [];
    for (const f of items) {
      try { done.push(await processItem(stuDir, stu, join(inbox, f))); }
      catch (e) { log(`  ✗ ${f} 失败: ${e.message}`); }
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
  log('夜间产线收工');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
