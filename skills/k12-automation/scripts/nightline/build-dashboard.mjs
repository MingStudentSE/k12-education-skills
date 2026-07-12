#!/usr/bin/env node
// K12 数据控制台（看板）生成器 v2 —— 扫 vault 出一个零依赖单文件 dashboard.html
// 用法: node build-dashboard.mjs   （读包根 students/*，输出包根 dashboard.html）
// 路线 A（静态 HTML）：无常驻进程、无鉴权、无额外 token；夜跑尾巴可顺手调用。
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hasLocalAuthorization, readStudentAuthorization } from './authorization.mjs';
import { businessDate } from './business-time.mjs';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.K12_ROOT || process.cwd();
const STUDENTS = join(ROOT, 'students');
const today = businessDate();

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

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return out;
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const listDir = (d, filter = () => true) => existsSync(d) ? readdirSync(d).filter(filter) : [];
const sev = (rec) => rec >= 3 ? 'red' : rec === 2 ? 'amber' : 'slate';

function readStudent(id) {
  const dir = join(STUDENTS, id);
  let authorization;
  try { authorization = readStudentAuthorization(dir); }
  catch { return null; }
  if (!hasLocalAuthorization(authorization.record)) return null;

  const archDir = join(dir, 'archive');
  const groups = {};
  let totalEntries = 0;
  for (const f of listDir(archDir, f => f.endsWith('.md'))) {
    const a = frontmatter(readFileSync(join(archDir, f), 'utf8'));
    if (!a.error_type) continue;
    totalEntries++;
    const key = a.error_type;
    const rec = parseInt(a.recurrence_count, 10) || 1;
    const g = groups[key] || (groups[key] = { error_type: key, topic: a.topic || '', count: 0, maxRec: 0, latest: '' });
    g.count++; g.maxRec = Math.max(g.maxRec, rec); if ((a.date || '') > g.latest) g.latest = a.date || '';
    if (a.topic) g.topic = a.topic;
  }
  const weak = Object.values(groups).sort((x, y) => y.maxRec - x.maxRec || y.count - x.count);
  const maxCount = Math.max(1, ...weak.map(w => w.count));

  const outDir = join(dir, 'outbox');
  const outDays = listDir(outDir, d => statSync(join(outDir, d)).isDirectory()).sort();
  const lastDay = outDays[outDays.length - 1] || '';
  const lastDayFiles = lastDay ? listDir(join(outDir, lastDay), f => f.endsWith('.md')) : [];

  const inbox = join(dir, 'inbox');
  const pending = listDir(inbox, f => /\.(md|txt)$/.test(f) && statSync(join(inbox, f)).isFile()).length;

  return { id, name: id, grade: '', subjects: [], totalEntries, weak, maxCount, lastDay, lastDayFiles, pending };
}

function card(s) {
  const initial = esc((s.name || '?').replace(/[（(].*$/, '').trim().slice(0, 1) || '?');
  const triggered = s.weak.filter(w => w.maxRec >= 3);
  const pills = s.subjects.map(x => `<span class="pill pill-${esc(x)}">${esc(SUBJ[x] || x)}</span>`).join('') || '<span class="pill">—</span>';
  const alertHtml = triggered.length
    ? `<div class="alert">
         <div class="alert-h">🔴 已触发专项 ${triggered.length} 项</div>` +
         triggered.map(w => `<div class="alert-item"><b>${esc(w.error_type)}</b><span class="tag tag-red">第 ${w.maxRec} 次</span></div>`).join('') +
       `</div>`
    : `<div class="ok">✓ 暂无触发专项的顽固弱项</div>`;
  const bars = s.weak.length
    ? s.weak.map(w => `<div class="bar-row">
        <div class="bar-top"><span class="bar-label" title="${esc(w.error_type)}">${esc(w.error_type)}</span><span class="tag tag-${sev(w.maxRec)}">第${w.maxRec}次</span></div>
        <div class="bar"><span class="bar-fill sev-${sev(w.maxRec)}" style="width:${Math.max(8, Math.round(w.count / s.maxCount * 100))}%"></span></div>
        <div class="bar-foot">${w.count} 次记录 · 最近 ${esc(w.latest) || '—'}${w.topic ? ' · ' + esc(w.topic) : ''}</div>
      </div>`).join('')
    : '<div class="muted">暂无错题档案</div>';
  const outLinks = s.lastDayFiles.length
    ? s.lastDayFiles.map(f => `<a href="students/${esc(s.id)}/outbox/${esc(s.lastDay)}/${encodeURIComponent(f)}">${esc(f.replace(/\.md$/, ''))}</a>`).join('')
    : '<span class="muted">无</span>';
  return `<article class="card">
  <header class="card-head">
    <div class="avatar sev-${triggered.length ? 'red' : 'slate'}">${initial}</div>
    <div class="who"><div class="name">${esc(s.name)}</div><div class="sub">${esc(s.grade)} ${pills}</div></div>
  </header>
  <div class="badges">
    <span class="badge${s.pending ? ' warn' : ''}"><i>📥</i>待处理 <b>${s.pending}</b></span>
    <span class="badge"><i>📤</i>昨晚产出 <b>${s.lastDayFiles.length}</b><em>${esc(s.lastDay) || '—'}</em></span>
    <span class="badge"><i>🗂</i>错题档案 <b>${s.totalEntries}</b></span>
  </div>
  ${alertHtml}
  <details${triggered.length ? ' open' : ''}><summary>弱项分布 · ${s.weak.length} 类</summary>
    <div class="bars">${bars}</div>
    <div class="out"><span class="out-h">最近产出</span>${outLinks}</div>
  </details>
</article>`;
}

function main() {
  const ids = listDir(STUDENTS, d => !d.startsWith('_') && statSync(join(STUDENTS, d)).isDirectory());
  const students = ids.map(readStudent).filter(Boolean).sort((a, b) =>
    b.weak.filter(w => w.maxRec >= 3).length - a.weak.filter(w => w.maxRec >= 3).length || b.pending - a.pending);
  const totalTriggered = students.reduce((n, s) => n + s.weak.filter(w => w.maxRec >= 3).length, 0);
  const totalPending = students.reduce((n, s) => n + s.pending, 0);
  const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>K12 错题控制台</title><style>
:root{--bg:#0f172a;--card:#fff;--line:#e9edf3;--ink:#1e293b;--mut:#94a3b8;--indigo:#6366f1;--red:#ef4444;--amber:#f59e0b;--slate:#64748b;--green:#10b981}
*{box-sizing:border-box}html{-webkit-font-smoothing:antialiased}
body{font:15px/1.6 -apple-system,"Segoe UI Variable","Segoe UI","Microsoft YaHei",sans-serif;margin:0;background:#eef1f6;color:var(--ink)}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px 48px}
header.top{background:linear-gradient(120deg,#1e293b,#312e81);color:#fff;padding:30px 0 26px;margin-bottom:-26px}
header.top .wrap{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-bottom:0}
header.top h1{margin:0;font-size:22px;font-weight:700;letter-spacing:.5px}
header.top .sub{opacity:.72;font-size:13px;margin-top:6px}
header.top .asof{font-size:12px;opacity:.6;background:rgba(255,255,255,.12);padding:5px 12px;border-radius:20px}
.summary{display:flex;gap:16px;flex-wrap:wrap;margin:38px 0 22px}
.stat{flex:1;min-width:150px;background:var(--card);border-radius:14px;padding:18px 20px;box-shadow:0 4px 20px rgba(30,41,59,.06);display:flex;align-items:center;gap:14px;border:1px solid var(--line)}
.stat .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:#eef2ff}
.stat.hot .ic{background:#fef2f2}.stat .n{font-size:26px;font-weight:800;line-height:1}.stat.hot .n{color:var(--red)}.stat .l{font-size:12px;color:var(--mut);margin-top:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px}
.card{background:var(--card);border-radius:16px;padding:20px;box-shadow:0 4px 24px rgba(30,41,59,.07);border:1px solid var(--line);transition:.18s}
.card:hover{box-shadow:0 10px 32px rgba(30,41,59,.12);transform:translateY(-2px)}
.card-head{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.avatar{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;font-size:20px;font-weight:700;flex:none;background:var(--slate)}
.avatar.sev-red{background:linear-gradient(135deg,#f43f5e,#e11d48)}.avatar.sev-slate{background:linear-gradient(135deg,#64748b,#475569)}
.name{font-size:18px;font-weight:700}.sub{font-size:12px;color:var(--mut);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pill{font-size:11px;background:#eef2ff;color:#4f46e5;border-radius:6px;padding:2px 7px;font-weight:600}
.pill-math{background:#eef2ff;color:#4f46e5}.pill-physics{background:#ecfeff;color:#0891b2}.pill-chinese{background:#fef2f2;color:#dc2626}.pill-english{background:#f0fdf4;color:#16a34a}
.pill-history{background:#fff7ed;color:#c2410c}.pill-geography{background:#ecfdf5;color:#047857}.pill-politics{background:#fdf2f8;color:#be185d}.pill-chemistry{background:#f0f9ff;color:#0369a1}.pill-biology{background:#f7fee7;color:#4d7c0f}
.badges{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}
.badge{font-size:12px;background:#f1f5f9;border-radius:9px;padding:7px 10px;display:flex;align-items:center;gap:5px;color:#475569}
.badge i{font-style:normal}.badge b{color:var(--ink);font-size:14px}.badge em{font-style:normal;color:var(--mut);margin-left:3px}
.badge.warn{background:#fef2f2;color:#dc2626}.badge.warn b{color:#dc2626}
.alert{background:linear-gradient(180deg,#fff5f5,#fff);border:1px solid #fecaca;border-radius:12px;padding:12px 14px;margin:12px 0}
.alert-h{font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px}
.alert-item{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;padding:4px 0;border-top:1px dashed #fecaca}
.alert-item:first-of-type{border-top:0}.alert-item b{font-weight:600;color:#7f1d1d}
.ok{color:var(--green);font-size:13px;margin:12px 0;background:#f0fdf4;border-radius:10px;padding:10px 12px;border:1px solid #bbf7d0}
.muted{color:var(--mut);font-size:13px}
.tag{font-size:11px;border-radius:20px;padding:2px 9px;font-weight:700;white-space:nowrap}
.tag-red{background:#fee2e2;color:#dc2626}.tag-amber{background:#fef3c7;color:#d97706}.tag-slate{background:#f1f5f9;color:#64748b}
details{margin-top:6px}details summary{cursor:pointer;font-size:13px;color:#64748b;padding:6px 0;font-weight:600;list-style:none}
details summary::-webkit-details-marker{display:none}details summary::before{content:'▸ ';transition:.2s}details[open] summary::before{content:'▾ '}
.bars{margin:6px 0 4px}.bar-row{margin:11px 0}
.bar-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12.5px;margin-bottom:5px}
.bar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.bar{background:#eef2f6;border-radius:6px;height:8px;overflow:hidden}
.bar-fill{display:block;height:100%;border-radius:6px}.sev-red.bar-fill,.bar-fill.sev-red{background:linear-gradient(90deg,#fb7185,#e11d48)}
.bar-fill.sev-amber{background:linear-gradient(90deg,#fbbf24,#d97706)}.bar-fill.sev-slate{background:linear-gradient(90deg,#94a3b8,#64748b)}
.bar-foot{font-size:11px;color:var(--mut);margin-top:4px}
.out{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.out-h{font-size:12px;color:var(--mut);margin-right:4px}
.out a{font-size:12px;color:#4f46e5;text-decoration:none;background:#eef2ff;padding:4px 9px;border-radius:7px}.out a:hover{background:#e0e7ff}
footer{text-align:center;color:var(--mut);font-size:12px;margin-top:32px}
.empty{background:#fff;border-radius:16px;padding:48px;text-align:center;color:var(--mut);border:1px dashed var(--line)}
</style></head><body>
<header class="top"><div class="wrap"><div><h1>📊 K12 错题控制台</h1><div class="sub">自用看板 · 路线 A 静态 HTML</div></div><div class="asof">数据截至 ${today}</div></div></header>
<div class="wrap">
  <div class="summary">
    <div class="stat"><div class="ic">👨‍🎓</div><div><div class="n">${students.length}</div><div class="l">在册学生</div></div></div>
    <div class="stat${totalTriggered ? ' hot' : ''}"><div class="ic">🔴</div><div><div class="n">${totalTriggered}</div><div class="l">已触发专项弱项</div></div></div>
    <div class="stat${totalPending ? ' hot' : ''}"><div class="ic">📥</div><div><div class="n">${totalPending}</div><div class="l">待处理错题</div></div></div>
  </div>
  <div class="grid">${students.map(card).join('\n') || '<div class="empty">没有已授权的 Automation 运行对象。请先通过本地控制台注册，或按运行手册建立 <code>automation/state.json</code>。</div>'}</div>
  <footer>K12 错题分析产线 · 看板由 build-dashboard.mjs 生成 · 数据源 vault 文件夹</footer>
</div>
</body></html>`;
  const outPath = join(ROOT, 'dashboard.html');
  writeFileSync(outPath, html);
  console.log(`看板已生成：${outPath}（${students.length} 学生，${totalTriggered} 触发专项，${totalPending} 待处理）`);
}

main();
