#!/usr/bin/env node
// K12 交互式控制台（路线 B）—— 在静态看板基础上加 4 个操作：新建学生 / 交错题 / 一键跑分析 / 在线看产出
// 安全：只绑 127.0.0.1，必须经 SSH 隧道访问（ssh -L 18350:localhost:18350 ...），公网不可见，故不另设密码。
// 用法: 在数据根运行 node /path/to/server.mjs（读取 K12_ROOT/students/*；分析会 spawn 同目录 night-run.mjs）
import { createServer } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync, renameSync } from 'fs';
import { basename, join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import {
  EXTERNAL_PROCESSING_SCOPE,
  authorizationSummary,
  hasExternalProcessingAuthorization,
  hasLocalAuthorization,
  normalizeProvider,
  readFrontmatterPrefix,
  validateAuthorizationInput,
} from './authorization.mjs';
import { businessDate, businessFileTimestamp } from './business-time.mjs';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.K12_ROOT || process.cwd();
const STUDENTS = join(ROOT, 'students');
const PORT = parseInt(process.env.K12_PORT, 10) || 18350;
const HOST = '127.0.0.1';
const MOCK_LLM = process.env.K12_MOCK_LLM === '1';
const CONFIG_PATH = join(ENGINE_DIR, 'config.json');
const MAX_REQUEST_BYTES = 25_000_000;
const MAX_OCR_IMAGES = 6;
const MAX_OCR_IMAGE_CHARS = 8_000_000;
const MAX_OCR_TOTAL_CHARS = 24_000_000;
const today = () => businessDate();
const SUBJ = {
  math: '数学',
  physics: '物理',
  chinese: '语文',
  english: '英语',
  history: '历史',
  geography: '地理',
  politics: '政治',
  chemistry: '化学',
  biology: '生物',
  general: '综合',
};
const subjectOptions = (selected = 'math') => Object.entries(SUBJ)
  .filter(([key]) => key !== 'general')
  .map(([key, label]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${label}</option>`)
  .join('');
const SAFE = (s) => /^[A-Za-z0-9_-]+$/.test(String(s || ''));
const oneLine = (value, maxLength = 120) => String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
const blockText = (value, maxLength = 2000) => String(value || '').trim().slice(0, maxLength);
let _cfg = null;
function getCfg() {
  if (_cfg) return _cfg;
  if (!existsSync(CONFIG_PATH)) throw new Error(`缺少配置文件：${CONFIG_PATH}`);
  let parsed;
  try { parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); }
  catch (e) { throw new Error(`配置文件不是有效 JSON：${e.message}`); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('配置文件顶层必须是 JSON 对象');
  const apibase = String(parsed.apibase || '').trim().replace(/\/+$/, '');
  let endpoint;
  try { endpoint = new URL(apibase); }
  catch { throw new Error('config.json 的 apibase 必须是绝对 http(s) URL'); }
  if (!['http:', 'https:'].includes(endpoint.protocol) || !endpoint.hostname) {
    throw new Error('config.json 的 apibase 必须是绝对 http(s) URL');
  }
  if (endpoint.hostname === 'your-openai-compatible-endpoint') {
    throw new Error('config.json 的 apibase 仍是示例占位值，请填写真实的模型服务地址');
  }
  if (typeof parsed.key !== 'string' || !parsed.key.trim()) throw new Error('config.json 的 key 必须是非空字符串');
  if (typeof parsed.model !== 'string' || !parsed.model.trim()) throw new Error('config.json 的 model 必须是非空字符串');
  const key = parsed.key.trim();
  if (key.includes('REPLACE-WITH-YOUR-OWN-KEY')) {
    throw new Error('config.json 的 key 仍是示例占位值，请填写真实的 API key');
  }
  const model = parsed.model.trim();
  _cfg = { ...parsed, apibase, key, model };
  return _cfg;
}
if (!MOCK_LLM) {
  try { getCfg(); }
  catch (e) {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  }
}
const OCR_PROMPT = `你是错题转写助手。把图片里的内容【原样转写】成文字，按以下三段输出（用 Markdown 标题），可能有多张图（题目和步骤常分开拍）：
# 题目原文
（印刷题干，公式用纯文本或 LaTeX，别漏条件）
# 学生的卷面步骤
（学生手写的解题过程，逐字转写，错的地方原样保留，绝对不要纠正、补全或重算）
# 可见批注/背景
（老师批注、分数、或其他可见信息；没有就写"无"）
只输出转写内容，不要分析、不要点评、不要给正确解法。`;

// ---------- 数据读取 ----------
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return out;
}
function hasProfileAuthorization(student) {
  const profilePath = join(STUDENTS, student, 'profile.md');
  if (!existsSync(profilePath)) return false;
  return hasLocalAuthorization(readFrontmatterPrefix(profilePath));
}
function hasProfileExternalAuthorization(student, provider) {
  const profilePath = join(STUDENTS, student, 'profile.md');
  if (!existsSync(profilePath)) return false;
  return hasExternalProcessingAuthorization(readFrontmatterPrefix(profilePath), provider);
}
function updateFrontmatterFields(text, updates) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('学生 profile.md 缺少有效 frontmatter');
  const pending = new Map(Object.entries(updates).map(([key, value]) => [key, String(value ?? '')]));
  const seen = new Set();
  const lines = [];
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':');
    const key = i > 0 ? line.slice(0, i).trim() : '';
    if (!pending.has(key)) { lines.push(line); continue; }
    if (seen.has(key)) continue;
    lines.push(`${key}: ${pending.get(key)}`);
    seen.add(key);
  }
  for (const [key, value] of pending) if (!seen.has(key)) lines.push(`${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---${text.slice(match[0].length)}`;
}
function writeAuthorizationUpdate(profilePath, updates) {
  const next = updateFrontmatterFields(readFileSync(profilePath, 'utf8'), updates);
  const tempPath = `${profilePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, next);
  renameSync(tempPath, profilePath);
}
function authorizationEventSummary(input, action, external) {
  if (action === 'update') {
    return `${authorizationSummary(input)}（${external ? '本地及外部处理' : '仅本地处理'}）`;
  }
  const subject = input.subject === 'student' ? '学生本人' : '监护人';
  const method = { written: '书面记录', verbal: '口头确认', digital: '电子确认' }[input.method];
  const event = action === 'revoke-local' ? '撤回本地及外部处理授权' : '保留本地处理、撤回外部处理授权';
  return `${subject}，${input.date}，${method}（${event}）`;
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const listDir = (d, f = () => true) => existsSync(d) ? readdirSync(d).filter(f) : [];
const parseSubjects = (raw) => String(raw || '').replace(/[\[\]]/g, '').split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
const sev = (rec) => rec >= 3 ? 'red' : rec === 2 ? 'amber' : 'slate';

function readStudent(id) {
  const dir = join(STUDENTS, id);
  const fm = existsSync(join(dir, 'profile.md')) ? readFrontmatterPrefix(join(dir, 'profile.md')) : {};
  if (!hasLocalAuthorization(fm)) {
    return { id, name: '未授权档案', grade: '', subjects: [], totalEntries: 0, weak: [], maxCount: 1, lastDay: '', lastDayFiles: [], pending: 0, authorized: false };
  }
  const archDir = join(dir, 'archive');
  const groups = {}; let totalEntries = 0;
  for (const f of listDir(archDir, f => f.endsWith('.md'))) {
    const a = frontmatter(readFileSync(join(archDir, f), 'utf8'));
    if (!a.error_type) continue; totalEntries++;
    const rec = parseInt(a.recurrence_count, 10) || 1;
    const g = groups[a.error_type] || (groups[a.error_type] = { error_type: a.error_type, topic: a.topic || '', count: 0, maxRec: 0, latest: '' });
    g.count++; g.maxRec = Math.max(g.maxRec, rec); if ((a.date || '') > g.latest) g.latest = a.date || ''; if (a.topic) g.topic = a.topic;
  }
  const weak = Object.values(groups).sort((x, y) => y.maxRec - x.maxRec || y.count - x.count);
  const maxCount = Math.max(1, ...weak.map(w => w.count));
  const outDir = join(dir, 'outbox');
  const outDays = listDir(outDir, d => statSync(join(outDir, d)).isDirectory()).sort();
  const lastDay = outDays[outDays.length - 1] || '';
  const lastDayFiles = lastDay ? listDir(join(outDir, lastDay), f => f.endsWith('.md')) : [];
  const pending = listDir(join(dir, 'inbox'), f => /\.(md|txt)$/.test(f) && statSync(join(dir, 'inbox', f)).isFile()).length;
  return { id, name: fm.name || id, grade: fm.grade || '', subjects: parseSubjects(fm.subjects), totalEntries, weak, maxCount, lastDay, lastDayFiles, pending, authorized: true };
}
const allStudents = () => listDir(STUDENTS, d => !d.startsWith('_') && statSync(join(STUDENTS, d)).isDirectory()).map(readStudent);

// ---------- 渲染 ----------
function card(s) {
  if (!s.authorized) return `<article class="card"><header class="card-head"><div class="avatar sev-slate">🔒</div><div class="who"><div class="name">${esc(s.id)}</div><div class="sub">未授权或授权记录不完整</div></div>${SAFE(s.id) ? `<div class="card-actions"><button class="mini" onclick="openAuthorization('${s.id}')">更新授权</button></div>` : ''}</header><div class="alert"><div class="alert-h">数据未读取</div><div class="muted">补齐结构化授权前，不展示姓名、错题历史、弱项、待处理项或产出。</div></div></article>`;
  const initial = esc((s.name || '?').replace(/[（(].*$/, '').trim().slice(0, 1) || '?');
  const triggered = s.weak.filter(w => w.maxRec >= 3);
  const pills = s.subjects.map(x => `<span class="pill pill-${esc(x)}">${esc(SUBJ[x] || x)}</span>`).join('') || '<span class="pill">—</span>';
  const alertHtml = triggered.length
    ? `<div class="alert"><div class="alert-h">🔴 已触发专项 ${triggered.length} 项</div>` +
      triggered.map(w => `<div class="alert-item"><b>${esc(w.error_type)}</b><span class="tag tag-red">第 ${w.maxRec} 次</span></div>`).join('') + `</div>`
    : `<div class="ok">✓ 暂无触发专项的顽固弱项</div>`;
  const bars = s.weak.length ? s.weak.map(w => `<div class="bar-row">
      <div class="bar-top"><span class="bar-label" title="${esc(w.error_type)}">${esc(w.error_type)}</span><span class="tag tag-${sev(w.maxRec)}">第${w.maxRec}次</span></div>
      <div class="bar"><span class="bar-fill sev-${sev(w.maxRec)}" style="width:${Math.max(8, Math.round(w.count / s.maxCount * 100))}%"></span></div>
      <div class="bar-foot">${w.count} 次记录 · 最近 ${esc(w.latest) || '—'}${w.topic ? ' · ' + esc(w.topic) : ''}</div></div>`).join('')
    : '<div class="muted">暂无错题档案</div>';
  const outLinks = s.lastDayFiles.length
    ? s.lastDayFiles.map(f => `<a href="#" onclick="viewFile('${esc(s.id)}','${esc(s.lastDay)}','${esc(encodeURIComponent(f))}');return false">${esc(f.replace(/\.md$/, ''))}</a>`).join('')
    : '<span class="muted">无</span>';
  return `<article class="card">
  <header class="card-head"><div class="avatar sev-${triggered.length ? 'red' : 'slate'}">${initial}</div>
    <div class="who"><div class="name">${esc(s.name)}</div><div class="sub">${esc(s.grade)} ${pills}</div></div>
    <div class="card-actions">
      ${SAFE(s.id) ? `<button class="mini" onclick="openAuthorization('${s.id}')">授权设置</button>` : ''}
      <button class="mini" onclick="openMistake('${esc(s.id)}')">+ 交错题</button>
      <button class="mini run" onclick="runAnalysis('${esc(s.id)}')">▶ 跑分析</button>
    </div></header>
  <div class="badges"><span class="badge${s.pending ? ' warn' : ''}"><i>📥</i>待处理 <b>${s.pending}</b></span>
    <span class="badge"><i>📤</i>昨晚产出 <b>${s.lastDayFiles.length}</b><em>${esc(s.lastDay) || '—'}</em></span>
    <span class="badge"><i>🗂</i>错题档案 <b>${s.totalEntries}</b></span></div>
  ${alertHtml}
  <details${triggered.length ? ' open' : ''}><summary>弱项分布 · ${s.weak.length} 类</summary>
    <div class="bars">${bars}</div><div class="out"><span class="out-h">最近产出</span>${outLinks}</div></details>
</article>`;
}

function renderHTML() {
  const students = allStudents().sort((a, b) => b.weak.filter(w => w.maxRec >= 3).length - a.weak.filter(w => w.maxRec >= 3).length || b.pending - a.pending);
  const totalTriggered = students.reduce((n, s) => n + s.weak.filter(w => w.maxRec >= 3).length, 0);
  const totalPending = students.reduce((n, s) => n + s.pending, 0);
  const stuOptions = students.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>K12 错题控制台</title><style>
:root{--ink:#1e293b;--mut:#94a3b8;--indigo:#6366f1;--red:#ef4444;--green:#10b981;--line:#e9edf3}
*{box-sizing:border-box}body{font:15px/1.6 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;margin:0;background:#eef1f6;color:var(--ink)}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px 48px}
header.top{background:linear-gradient(120deg,#1e293b,#312e81);color:#fff;padding:26px 0}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-bottom:0}
header.top h1{margin:0;font-size:21px}header.top .sub{opacity:.72;font-size:13px;margin-top:5px}
.tools{display:flex;gap:10px}.btn{border:0;border-radius:10px;padding:9px 15px;font-size:14px;font-weight:600;cursor:pointer;background:#fff;color:#312e81}
.btn.ghost{background:rgba(255,255,255,.15);color:#fff}.btn:hover{opacity:.9}
.summary{display:flex;gap:16px;flex-wrap:wrap;margin:26px 0 22px}
.stat{flex:1;min-width:150px;background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 4px 20px rgba(30,41,59,.06);display:flex;align-items:center;gap:14px;border:1px solid var(--line)}
.stat .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:#eef2ff}.stat.hot .ic{background:#fef2f2}
.stat .n{font-size:26px;font-weight:800;line-height:1}.stat.hot .n{color:var(--red)}.stat .l{font-size:12px;color:var(--mut);margin-top:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px}
.card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 24px rgba(30,41,59,.07);border:1px solid var(--line);transition:.18s}
.card:hover{box-shadow:0 10px 32px rgba(30,41,59,.12);transform:translateY(-2px)}
.card-head{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.avatar{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;font-size:20px;font-weight:700;flex:none}
.avatar.sev-red{background:linear-gradient(135deg,#f43f5e,#e11d48)}.avatar.sev-slate{background:linear-gradient(135deg,#64748b,#475569)}
.who{flex:1}.name{font-size:18px;font-weight:700}.sub{font-size:12px;color:var(--mut);margin-top:3px;display:flex;gap:6px;flex-wrap:wrap}
.card-actions{display:flex;flex-direction:column;gap:6px}
.mini{border:1px solid var(--line);background:#f8fafc;border-radius:8px;padding:5px 9px;font-size:12px;cursor:pointer;white-space:nowrap}.mini:hover{background:#eef2ff}.mini.run{color:#312e81;font-weight:600}
.pill{font-size:11px;background:#eef2ff;color:#4f46e5;border-radius:6px;padding:2px 7px;font-weight:600}
.pill-physics{background:#ecfeff;color:#0891b2}.pill-chinese{background:#fef2f2;color:#dc2626}.pill-english{background:#f0fdf4;color:#16a34a}
.pill-history{background:#fff7ed;color:#c2410c}.pill-geography{background:#ecfdf5;color:#047857}.pill-politics{background:#fdf2f8;color:#be185d}.pill-chemistry{background:#f0f9ff;color:#0369a1}.pill-biology{background:#f7fee7;color:#4d7c0f}
.badges{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}.badge{font-size:12px;background:#f1f5f9;border-radius:9px;padding:7px 10px;display:flex;align-items:center;gap:5px;color:#475569}
.badge i{font-style:normal}.badge b{color:var(--ink);font-size:14px}.badge em{font-style:normal;color:var(--mut);margin-left:3px}.badge.warn{background:#fef2f2;color:#dc2626}.badge.warn b{color:#dc2626}
.alert{background:linear-gradient(180deg,#fff5f5,#fff);border:1px solid #fecaca;border-radius:12px;padding:12px 14px;margin:12px 0}
.alert-h{font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px}.alert-item{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:4px 0;border-top:1px dashed #fecaca}.alert-item:first-of-type{border-top:0}.alert-item b{color:#7f1d1d}
.ok{color:var(--green);font-size:13px;margin:12px 0;background:#f0fdf4;border-radius:10px;padding:10px 12px;border:1px solid #bbf7d0}.muted{color:var(--mut);font-size:13px}
.tag{font-size:11px;border-radius:20px;padding:2px 9px;font-weight:700;white-space:nowrap}.tag-red{background:#fee2e2;color:#dc2626}.tag-amber{background:#fef3c7;color:#d97706}.tag-slate{background:#f1f5f9;color:#64748b}
details{margin-top:6px}summary{cursor:pointer;font-size:13px;color:#64748b;padding:6px 0;font-weight:600;list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:'▸ '}details[open] summary::before{content:'▾ '}
.bar-row{margin:11px 0}.bar-top{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;margin-bottom:5px}.bar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.bar{background:#eef2f6;border-radius:6px;height:8px;overflow:hidden}.bar-fill{display:block;height:100%;border-radius:6px}
.bar-fill.sev-red{background:linear-gradient(90deg,#fb7185,#e11d48)}.bar-fill.sev-amber{background:linear-gradient(90deg,#fbbf24,#d97706)}.bar-fill.sev-slate{background:linear-gradient(90deg,#94a3b8,#64748b)}
.bar-foot{font-size:11px;color:var(--mut);margin-top:4px}
.out{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center}.out-h{font-size:12px;color:var(--mut)}
.out a{font-size:12px;color:#4f46e5;text-decoration:none;background:#eef2ff;padding:4px 9px;border-radius:7px}.out a:hover{background:#e0e7ff}
.empty{background:#fff;border-radius:16px;padding:48px;text-align:center;color:var(--mut);border:1px dashed var(--line)}
.modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:flex-start;justify-content:center;padding:40px 16px;z-index:50;overflow:auto}
.modal-bg.show{display:flex}.modal{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:640px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal h3{margin:0 0 16px}.modal label{display:block;font-size:13px;color:#475569;margin:12px 0 4px;font-weight:600}
.modal input,.modal select,.modal textarea{width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:9px 11px;font:inherit}
.consent-row{display:flex!important;align-items:flex-start;gap:9px;font-weight:500!important;line-height:1.45}.modal .consent-row input{width:auto;margin-top:3px;flex:none}
.modal textarea{min-height:120px;resize:vertical}.modal .row{display:flex;gap:12px}.modal .row>*{flex:1}
.modal-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.modal-foot .btn{background:var(--indigo);color:#fff}.modal-foot .cancel{background:#f1f5f9;color:#475569}
.md{font-size:14px;line-height:1.7}.md h1,.md h2,.md h3{margin:.6em 0 .3em}.md pre{background:#f8fafc;padding:12px;border-radius:8px;overflow:auto}.md code{background:#f1f5f9;padding:1px 5px;border-radius:4px}
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:11px 20px;border-radius:10px;font-size:14px;display:none;z-index:60}
.spin{display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px;margin-right:6px}@keyframes sp{to{transform:rotate(360deg)}}
</style></head><body>
<header class="top"><div class="wrap"><div><h1>📊 K12 错题控制台</h1><div class="sub">交互版 · 本地隧道访问 · 数据截至 ${today()}</div></div>
  <div class="tools"><button class="btn ghost" onclick="openStudent()">+ 新建学生</button><button class="btn" onclick="location.reload()">⟳ 刷新</button></div></div></header>
<div class="wrap">
  <div class="summary">
    <div class="stat"><div class="ic">👨‍🎓</div><div><div class="n">${students.length}</div><div class="l">在册学生</div></div></div>
    <div class="stat${totalTriggered ? ' hot' : ''}"><div class="ic">🔴</div><div><div class="n">${totalTriggered}</div><div class="l">已触发专项弱项</div></div></div>
    <div class="stat${totalPending ? ' hot' : ''}"><div class="ic">📥</div><div><div class="n">${totalPending}</div><div class="l">待处理错题</div></div></div>
  </div>
  <div class="grid">${students.map(card).join('\n') || '<div class="empty">还没有学生，点右上角「+ 新建学生」。</div>'}</div>
</div>
<div class="modal-bg" id="modal"><div class="modal" id="modalBody"></div></div>
<div id="toast"></div>
<script>
const STU_OPTS=\`${stuOptions}\`;
const M=document.getElementById('modal'),MB=document.getElementById('modalBody');
const OCR_MAX_IMAGES=${MAX_OCR_IMAGES},OCR_MAX_IMAGE_CHARS=${MAX_OCR_IMAGE_CHARS},OCR_MAX_TOTAL_CHARS=${MAX_OCR_TOTAL_CHARS};
function closeModal(){M.classList.remove('show')}
M.onclick=e=>{if(e.target===M)closeModal()};
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.style.display='block';setTimeout(()=>el.style.display='none',2600)}
async function api(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||('HTTP '+r.status));return d}
function openStudent(){MB.innerHTML=\`<h3>新建学生</h3>
  <div class="row"><div><label>学号(英文/数字)</label><input id="f_id" placeholder="stu-002"></div><div><label>姓名</label><input id="f_name" placeholder="张同学"></div></div>
  <div class="row"><div><label>年级</label><input id="f_grade" placeholder="初二"></div><div><label>学科</label><select id="f_subj">${subjectOptions()}</select></div></div>
  <label>学习画像(可空)</label><textarea id="f_bio" placeholder="只填与当前学习任务有关的低敏摘要"></textarea>
  <label class="consent-row"><input type="checkbox" id="f_consent">我确认已获得学生本人或其监护人明确同意，在本机建立并处理这份学习档案。</label>
  <div class="row"><div><label>授权主体</label><select id="f_auth_subject"><option value="guardian">监护人</option><option value="student">学生本人</option></select></div><div><label>授权日期</label><input type="date" id="f_auth_date" value="${today()}"></div><div><label>授权方式</label><select id="f_auth_method"><option value="written">书面</option><option value="digital">电子确认</option><option value="verbal">口头</option></select></div></div>
  <label class="consent-row"><input type="checkbox" id="f_external_consent">另行同意：运行真实分析时，将低敏画像摘要、当前错题和最近 3 份错题档案发送到 k12-automation 本地 config.json 配置的模型服务。提供方变化后需重新授权。</label>
  <div class="modal-foot"><button class="cancel btn" onclick="closeModal()">取消</button><button class="btn" onclick="submitStudent(this)">创建</button></div>\`;M.classList.add('show')}
async function submitStudent(btn){try{if(!f_consent.checked)return alert('请先确认已获得明确建档授权');if(!f_auth_date.value)return alert('请选择授权日期');
  btn.innerHTML='<span class=spin></span>创建中';btn.disabled=1;
  await api('/api/student',{id:f_id.value.trim(),name:f_name.value.trim(),grade:f_grade.value.trim(),subjects:f_subj.value,bio:f_bio.value.trim(),consent:true,authorizationSubject:f_auth_subject.value,authorizationDate:f_auth_date.value,authorizationMethod:f_auth_method.value,externalProcessingConsent:f_external_consent.checked});
  toast('学生已创建');setTimeout(()=>location.reload(),700)}catch(e){alert(e.message);btn.innerHTML='创建';btn.disabled=0}}
function openAuthorization(id){MB.innerHTML=\`<h3>更新/撤回授权 → \${id}</h3>
  <p class="muted">每次变更都要重新记录授权主体、日期和方式。撤回本地授权会同时撤回外部处理授权。</p>
  <label>操作</label><select id="a_action" onchange="syncAuthorizationForm()"><option value="update">更新/恢复本地授权</option><option value="revoke-external">仅撤回外部处理授权</option><option value="revoke-local">撤回本地及外部处理授权</option></select>
  <div class="row"><div><label>授权主体</label><select id="a_subject"><option value="guardian">监护人</option><option value="student">学生本人</option></select></div><div><label>记录日期</label><input type="date" id="a_date" value="${today()}"></div><div><label>记录方式</label><select id="a_method"><option value="written">书面</option><option value="digital">电子确认</option><option value="verbal">口头</option></select></div></div>
  <label class="consent-row" id="a_external_row"><input type="checkbox" id="a_external">同时授权/恢复外部模型处理；不勾选会清除已有外部授权。提供方取当前 config origin，范围固定为低敏画像摘要、当前错题和最近 3 份档案。</label>
  <div id="a_hint" class="muted"></div>
  <label class="consent-row"><input type="checkbox" id="a_confirm">我确认以上操作和结构化记录准确。</label>
  <div class="modal-foot"><button class="cancel btn" onclick="closeModal()">取消</button><button class="btn" onclick="submitAuthorization(this,'\${id}')">确认变更</button></div>\`;M.classList.add('show');syncAuthorizationForm()}
function syncAuthorizationForm(){const action=a_action.value;a_external_row.style.display=action==='update'?'flex':'none';a_hint.textContent=action==='revoke-external'?'仅撤回外部处理；有效本地授权继续保留。':action==='revoke-local'?'本地与外部授权都会立即失效，首页、文件读取、写入和分析将被阻断。':'更新或恢复本地授权，并按复选框决定是否授权外部处理。'}
async function submitAuthorization(btn,id){try{if(!a_confirm.checked)return alert('请确认本次授权变更记录');if(!a_date.value)return alert('请选择记录日期');const action=a_action.value;
  btn.innerHTML='<span class=spin></span>更新中';btn.disabled=1;
  await api('/api/authorization',{student:id,action,confirmation:true,authorizationSubject:a_subject.value,authorizationDate:a_date.value,authorizationMethod:a_method.value,externalProcessingConsent:action==='update'&&a_external.checked});
  toast('授权状态已更新');setTimeout(()=>location.reload(),700)}catch(e){alert(e.message);btn.innerHTML='确认变更';btn.disabled=0}}
function openMistake(id){MB.innerHTML=\`<h3>交错题 → \${id}</h3>
  <label>📷 拍照转写（可选 · config 中的 model 必须支持视觉输入 · 填入后请人工核对）</label>
  <input type="file" id="m_imgs" accept="image/*" multiple>
  <div class="muted">最多 6 张；单张编码后不超过 8,000,000 字符；总图片编码不超过 24,000,000 字符。</div>
  <label class="consent-row"><input type="checkbox" id="m_ocr_consent">我明确同意仅为本次转写，把所选图片发送到 k12-automation 本地 config.json 配置的视觉模型服务。</label>
  <button class="mini" style="margin-top:8px" onclick="doOcr(this)">识别照片 → 填入下方</button>
  <label>学科</label><select id="m_subj">${subjectOptions()}</select>
  <label>错题内容(题目原文 + 学生卷面步骤 + 一句话背景，越全分析越准)</label><textarea id="m_body" placeholder="# 题目原文&#10;...&#10;&#10;# 学生的卷面步骤&#10;...&#10;&#10;# 一句话背景&#10;..."></textarea>
  <div class="modal-foot"><button class="cancel btn" onclick="closeModal()">取消</button><button class="btn" onclick="submitMistake(this,'\${id}')">提交到 inbox</button></div>\`;M.classList.add('show')}
async function submitMistake(btn,id){try{if(!m_body.value.trim())return alert('错题内容不能为空');btn.innerHTML='<span class=spin></span>提交中';btn.disabled=1;
  await api('/api/mistake',{student:id,subject:m_subj.value,content:m_body.value});
  toast('已进 inbox，点「跑分析」出结果');setTimeout(()=>location.reload(),700)}catch(e){alert(e.message);btn.innerHTML='提交到 inbox';btn.disabled=0}}
async function doOcr(btn){const files=[...document.getElementById('m_imgs').files];if(!files.length)return alert('先选照片');if(files.length>OCR_MAX_IMAGES)return alert('一次最多 6 张图片');const estimates=files.map(f=>Math.ceil(f.size/3)*4+('data:'+(f.type||'')+';base64,').length);if(estimates.some(n=>n>OCR_MAX_IMAGE_CHARS))return alert('存在原文件编码后会超过 8,000,000 字符，请压缩或裁剪');if(estimates.reduce((a,b)=>a+b,0)>OCR_MAX_TOTAL_CHARS)return alert('所选原文件总编码会超过 24,000,000 字符，请减少图片');if(!m_ocr_consent.checked)return alert('请先确认本次图片外部转写授权');m_ocr_consent.checked=false;
  const old=btn.innerHTML;btn.innerHTML='<span class=spin></span>识别中…';btn.disabled=1;
  try{const imgs=await Promise.all([...files].map(f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})));
    if(imgs.some(s=>typeof s!=='string'||s.length>OCR_MAX_IMAGE_CHARS))throw new Error('存在图片编码后超过 8,000,000 字符');if(imgs.reduce((n,s)=>n+s.length,0)>OCR_MAX_TOTAL_CHARS)throw new Error('图片总编码超过 24,000,000 字符');
    const d=await api('/api/ocr',{images:imgs,externalProcessingConsent:true});document.getElementById('m_body').value=d.text||'';
    toast('已转写 '+files.length+' 张，请核对手写步骤再提交')}catch(e){alert('识别失败：'+e.message)}finally{btn.innerHTML=old;btn.disabled=0}}
async function runAnalysis(id){if(!confirm('对 '+id+' 跑分析？会调用 LLM 产生 token 费用，约 1-2 分钟。'))return;
  toast('分析中…约 1-2 分钟，别关页面');try{const d=await api('/api/run',{student:id});toast('分析完成：'+(d.summary||'见产出'));setTimeout(()=>location.reload(),900)}catch(e){alert('分析失败：'+e.message)}}
async function viewFile(id,day,name){MB.innerHTML='<h3>加载中…</h3>';M.classList.add('show');
  try{const r=await fetch('/api/file?student='+id+'&day='+day+'&name='+name);const t=await r.text();if(!r.ok)throw new Error(t);
    MB.innerHTML='<h3>'+decodeURIComponent(name).replace(/\\.md$/,'')+'</h3><div class="md">'+mdRender(t)+'</div><div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button></div>'}
  catch(e){MB.innerHTML='<h3>读取失败</h3><p>'+e.message+'</p><div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button></div>'}}
function mdRender(s){s=s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  return s.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>').replace(/\`(.+?)\`/g,'<code>$1</code>').replace(/^- (.*)$/gm,'• $1').replace(/\\n/g,'<br>')}
</script></body></html>`;
}

// ---------- HTTP ----------
function send(res, code, body, type = 'text/html; charset=utf-8') { res.writeHead(code, { 'Content-Type': type }); res.end(body); }
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function readBody(req) {
  return new Promise((ok, no) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_REQUEST_BYTES) { tooLarge = true; chunks.length = 0; return; }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return no(new HttpError(413, `请求体超过 ${MAX_REQUEST_BYTES} 字节上限`));
      const text = Buffer.concat(chunks).toString('utf8');
      try { ok(text ? JSON.parse(text) : {}); }
      catch { no(new HttpError(400, '请求体必须是有效 JSON')); }
    });
    req.on('aborted', () => no(new HttpError(400, '请求在读取完成前中断')));
    req.on('error', no);
  });
}

const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${HOST}`);
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) return send(res, 200, renderHTML());

    if (req.method === 'GET' && u.pathname === '/api/file') {
      const { student, day, name } = Object.fromEntries(u.searchParams);
      if (!SAFE(student) || !SAFE(day.replace(/-/g, ''))) return send(res, 400, 'bad params', 'text/plain');
      if (!hasProfileAuthorization(student)) return send(res, 403, 'student profile is not authorized', 'text/plain');
      const fname = String(name || '');
      if (!fname.endsWith('.md') || fname !== basename(fname) || /[\\/\0]/.test(fname)) return send(res, 400, 'bad file name', 'text/plain');
      const base = resolve(STUDENTS, student, 'outbox', day);
      const p = resolve(base, fname);
      if (dirname(p) !== base || !existsSync(p)) return send(res, 404, 'not found', 'text/plain');
      return send(res, 200, readFileSync(p, 'utf8'), 'text/plain; charset=utf-8');
    }

    if (req.method === 'POST' && u.pathname === '/api/student') {
      const b = await readBody(req);
      if (!SAFE(b.id)) return send(res, 400, JSON.stringify({ error: '学号只能用英文/数字/-/_' }), 'application/json');
      if (b.consent !== true) return send(res, 400, JSON.stringify({ error: '未确认建档授权，不能创建长期学生档案' }), 'application/json');
      const authInput = { subject: b.authorizationSubject, date: b.authorizationDate, method: b.authorizationMethod };
      const authError = validateAuthorizationInput(authInput);
      if (authError) return send(res, 400, JSON.stringify({ error: authError }), 'application/json');
      const authorizedBy = authorizationSummary(authInput);
      let externalProvider = '';
      if (b.externalProcessingConsent === true) {
        let cfg; try { cfg = getCfg(); } catch (e) { return send(res, 400, JSON.stringify({ error: `不能记录外部处理授权：${e.message}` }), 'application/json'); }
        externalProvider = normalizeProvider(cfg.apibase);
        if (!externalProvider) return send(res, 400, JSON.stringify({ error: 'config.json 的 apibase 不是有效绝对 URL' }), 'application/json');
      }
      const dir = join(STUDENTS, b.id);
      if (existsSync(dir)) return send(res, 400, JSON.stringify({ error: '该学号已存在' }), 'application/json');
      mkdirSync(join(dir, 'inbox'), { recursive: true }); mkdirSync(join(dir, 'archive'), { recursive: true }); mkdirSync(join(dir, 'outbox'), { recursive: true });
      const name = oneLine(b.name, 80) || b.id;
      const grade = oneLine(b.grade, 40);
      const subject = SUBJ[b.subjects] && b.subjects !== 'general' ? b.subjects : 'math';
      const bio = blockText(b.bio) || '（待补充）';
      const external = b.externalProcessingConsent === true;
      const profile = `---\nid: ${b.id}\nname: ${name}\ngrade: ${grade}\nsubjects: [${subject}]\nauthorized: true\nauthorized_by: ${authorizedBy}\nauthorization_subject: ${authInput.subject}\nauthorization_date: ${authInput.date}\nauthorization_method: ${authInput.method}\nexternal_processing_authorized: ${external}\nexternal_processing_provider: ${externalProvider}\nexternal_processing_scope: ${external ? EXTERNAL_PROCESSING_SCOPE : ''}\nexternal_processing_authorization_date: ${external ? authInput.date : ''}\n---\n\n# 学习画像\n\n${bio}\n`;
      writeFileSync(join(dir, 'profile.md'), profile);
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    }

    if (req.method === 'POST' && u.pathname === '/api/authorization') {
      const b = await readBody(req);
      const profilePath = SAFE(b.student) ? join(STUDENTS, b.student, 'profile.md') : '';
      if (!profilePath || !existsSync(profilePath)) return send(res, 400, JSON.stringify({ error: '学生不存在或缺少 profile.md' }), 'application/json');
      if (b.confirmation !== true) return send(res, 400, JSON.stringify({ error: '未确认本次授权变更' }), 'application/json');
      const actions = new Set(['update', 'revoke-external', 'revoke-local']);
      if (!actions.has(b.action)) return send(res, 400, JSON.stringify({ error: '不支持的授权操作' }), 'application/json');
      const authInput = { subject: b.authorizationSubject, date: b.authorizationDate, method: b.authorizationMethod };
      const authError = validateAuthorizationInput(authInput);
      if (authError) return send(res, 400, JSON.stringify({ error: authError }), 'application/json');
      const current = readFrontmatterPrefix(profilePath);
      if (b.action === 'revoke-external' && !hasLocalAuthorization(current)) {
        return send(res, 409, JSON.stringify({ error: '本地授权当前无效；请使用“更新/恢复本地授权”' }), 'application/json');
      }

      const localAuthorized = b.action !== 'revoke-local';
      const externalAuthorized = b.action === 'update' && b.externalProcessingConsent === true;
      let provider = '';
      if (externalAuthorized) {
        let cfg; try { cfg = getCfg(); }
        catch (e) { return send(res, 400, JSON.stringify({ error: `不能记录外部处理授权：${e.message}` }), 'application/json'); }
        provider = normalizeProvider(cfg.apibase);
      }
      writeAuthorizationUpdate(profilePath, {
        authorized: localAuthorized,
        authorized_by: authorizationEventSummary(authInput, b.action, externalAuthorized),
        authorization_subject: authInput.subject,
        authorization_date: authInput.date,
        authorization_method: authInput.method,
        authorization_action: b.action,
        external_processing_authorized: externalAuthorized,
        external_processing_provider: externalAuthorized ? provider : '',
        external_processing_scope: externalAuthorized ? EXTERNAL_PROCESSING_SCOPE : '',
        external_processing_authorization_date: externalAuthorized ? authInput.date : '',
      });
      return send(res, 200, JSON.stringify({ ok: true, localAuthorized, externalAuthorized, provider: externalAuthorized ? provider : null }), 'application/json');
    }

    if (req.method === 'POST' && u.pathname === '/api/mistake') {
      const b = await readBody(req);
      if (!SAFE(b.student) || !existsSync(join(STUDENTS, b.student))) return send(res, 400, JSON.stringify({ error: '学生不存在' }), 'application/json');
      if (!hasProfileAuthorization(b.student)) return send(res, 403, JSON.stringify({ error: '学生档案未记录明确授权，不能写入错题' }), 'application/json');
      if (typeof b.content !== 'string' || !b.content.trim()) return send(res, 400, JSON.stringify({ error: '错题内容为空' }), 'application/json');
      if (b.content.length > 20000) return send(res, 400, JSON.stringify({ error: '错题内容超过 20000 字符，请只保留当前题目、学生步骤和必要背景' }), 'application/json');
      const subj = SUBJ[b.subject] ? b.subject : 'math';
      const ts = businessFileTimestamp();
      const file = join(STUDENTS, b.student, 'inbox', `web-${ts}.md`);
      writeFileSync(file, `---\nsubject: ${subj}\nsource: 网页提交 ${today()}\n---\n\n${b.content}\n`);
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    }

    if (req.method === 'POST' && u.pathname === '/api/run') {
      const b = await readBody(req);
      if (!SAFE(b.student) || !existsSync(join(STUDENTS, b.student))) return send(res, 400, JSON.stringify({ error: '学生不存在' }), 'application/json');
      if (!hasProfileAuthorization(b.student)) return send(res, 403, JSON.stringify({ error: '学生档案未记录明确授权，不能运行长期分析' }), 'application/json');
      if (!MOCK_LLM) {
        let cfg; try { cfg = getCfg(); } catch (e) { return send(res, 500, JSON.stringify({ error: e.message }), 'application/json'); }
        const provider = normalizeProvider(cfg.apibase);
        if (!hasProfileExternalAuthorization(b.student, provider)) return send(res, 403, JSON.stringify({ error: '未授权向当前模型服务发送低敏画像摘要、当前错题和最近 3 份错题档案，或提供方已变化' }), 'application/json');
      }
      const child = spawn(process.execPath, [join(ENGINE_DIR, 'night-run.mjs'), '--student', b.student], { cwd: ROOT, env: { ...process.env, K12_ROOT: ROOT } });
      let out = '';
      child.stdout.on('data', d => out += d); child.stderr.on('data', d => out += d);
      child.on('close', code => {
        const ok = code === 0 && /完成|收工/.test(out);
        const successSummary = (out.match(/✓ .*完成[^\n]*/) || [''])[0].trim();
        const errorSummary = (out.match(/✗[^\n]*/) || [''])[0].trim();
        send(res, ok ? 200 : 500, JSON.stringify(ok ? { ok: true, summary: successSummary } : { error: errorSummary || ('退出码 ' + code) }), 'application/json');
      });
      return;
    }

    if (req.method === 'POST' && u.pathname === '/api/ocr') {
      const b = await readBody(req);
      if (b.externalProcessingConsent !== true) return send(res, 400, JSON.stringify({ error: '未确认本次图片外部转写授权' }), 'application/json');
      if (!Array.isArray(b.images) || !b.images.length) return send(res, 400, JSON.stringify({ error: '没有有效图片' }), 'application/json');
      if (b.images.length > MAX_OCR_IMAGES) return send(res, 400, JSON.stringify({ error: `一次最多 ${MAX_OCR_IMAGES} 张图片` }), 'application/json');
      if (b.images.some(s => typeof s !== 'string' || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(s))) {
        return send(res, 400, JSON.stringify({ error: '图片必须是 base64 data:image URL' }), 'application/json');
      }
      if (b.images.some(s => s.length > MAX_OCR_IMAGE_CHARS)) {
        return send(res, 400, JSON.stringify({ error: `单张图片编码后不能超过 ${MAX_OCR_IMAGE_CHARS} 字符` }), 'application/json');
      }
      const totalImageChars = b.images.reduce((sum, image) => sum + image.length, 0);
      if (totalImageChars > MAX_OCR_TOTAL_CHARS) {
        return send(res, 400, JSON.stringify({ error: `图片总编码不能超过 ${MAX_OCR_TOTAL_CHARS} 字符` }), 'application/json');
      }
      const imgs = b.images;
      const cfg = getCfg();
      const content = [{ type: 'text', text: OCR_PROMPT }, ...imgs.map(url => ({ type: 'image_url', image_url: { url } }))];
      try {
        const r = await fetch(cfg.apibase + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key }, body: JSON.stringify({ model: cfg.model || 'gpt-5.5', messages: [{ role: 'user', content }] }) });
        const t = await r.text();
        if (!r.ok) return send(res, 502, JSON.stringify({ error: 'OCR HTTP ' + r.status + ' ' + t.slice(0, 120) }), 'application/json');
        const j = JSON.parse(t);
        return send(res, 200, JSON.stringify({ text: j.choices?.[0]?.message?.content || '' }), 'application/json');
      } catch (e) { return send(res, 502, JSON.stringify({ error: e.message }), 'application/json'); }
    }

    send(res, 404, 'not found', 'text/plain');
  } catch (e) { send(res, e.status || 500, JSON.stringify({ error: e.message }), 'application/json'); }
});

server.listen(PORT, HOST, () => console.log(`K12 控制台已启动：http://${HOST}:${PORT}（仅本地，需 SSH 隧道访问）ROOT=${ROOT}`));
