#!/usr/bin/env node
// K12 交互式控制台（路线 B）—— 在静态看板基础上加 4 个操作：新建学生 / 交错题 / 一键跑分析 / 在线看产出
// 安全：只绑 127.0.0.1，必须经 SSH 隧道访问（ssh -L 18350:localhost:18350 ...），公网不可见，故不另设密码。
// 用法: node server.mjs   （读包根 students/*；跑分析会 spawn 同目录 night-run.mjs，需 engine/config.json）
import { createServer } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.K12_ROOT || join(ENGINE_DIR, '..');
const STUDENTS = join(ROOT, 'students');
const PORT = parseInt(process.env.K12_PORT, 10) || 18350;
const HOST = '127.0.0.1';
const today = () => new Date().toISOString().slice(0, 10);
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
let _cfg = null;
function getCfg() {
  if (_cfg) return _cfg;
  const p = join(ENGINE_DIR, 'config.json');
  if (!existsSync(p)) throw new Error('缺 engine/config.json，OCR 需要 LLM key');
  _cfg = JSON.parse(readFileSync(p, 'utf8'));
  return _cfg;
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
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const listDir = (d, f = () => true) => existsSync(d) ? readdirSync(d).filter(f) : [];
const parseSubjects = (raw) => String(raw || '').replace(/[\[\]]/g, '').split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
const sev = (rec) => rec >= 3 ? 'red' : rec === 2 ? 'amber' : 'slate';

function readStudent(id) {
  const dir = join(STUDENTS, id);
  const fm = existsSync(join(dir, 'profile.md')) ? frontmatter(readFileSync(join(dir, 'profile.md'), 'utf8')) : {};
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
  return { id, name: fm.name || id, grade: fm.grade || '', subjects: parseSubjects(fm.subjects), totalEntries, weak, maxCount, lastDay, lastDayFiles, pending };
}
const allStudents = () => listDir(STUDENTS, d => !d.startsWith('_') && statSync(join(STUDENTS, d)).isDirectory()).map(readStudent);

// ---------- 渲染 ----------
function card(s) {
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
function closeModal(){M.classList.remove('show')}
M.onclick=e=>{if(e.target===M)closeModal()};
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.style.display='block';setTimeout(()=>el.style.display='none',2600)}
async function api(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||('HTTP '+r.status));return d}
function openStudent(){MB.innerHTML=\`<h3>新建学生</h3>
  <div class="row"><div><label>学号(英文/数字)</label><input id="f_id" placeholder="stu-002"></div><div><label>姓名</label><input id="f_name" placeholder="张同学"></div></div>
  <div class="row"><div><label>年级</label><input id="f_grade" placeholder="初二"></div><div><label>学科</label><select id="f_subj">${subjectOptions()}</select></div></div>
  <label>学习画像(可空)</label><textarea id="f_bio" placeholder="已知倾向、家长关注点…"></textarea>
  <div class="modal-foot"><button class="cancel btn" onclick="closeModal()">取消</button><button class="btn" onclick="submitStudent(this)">创建</button></div>\`;M.classList.add('show')}
async function submitStudent(btn){try{btn.innerHTML='<span class=spin></span>创建中';btn.disabled=1;
  await api('/api/student',{id:f_id.value.trim(),name:f_name.value.trim(),grade:f_grade.value.trim(),subjects:f_subj.value,bio:f_bio.value.trim()});
  toast('学生已创建');setTimeout(()=>location.reload(),700)}catch(e){alert(e.message);btn.innerHTML='创建';btn.disabled=0}}
function openMistake(id){MB.innerHTML=\`<h3>交错题 → \${id}</h3>
  <label>📷 拍照转写（可选 · gpt-5.5 识别 · 填入后请人工核对手写步骤）</label>
  <input type="file" id="m_imgs" accept="image/*" multiple>
  <button class="mini" style="margin-top:8px" onclick="doOcr(this)">识别照片 → 填入下方</button>
  <label>学科</label><select id="m_subj">${subjectOptions()}</select>
  <label>错题内容(题目原文 + 学生卷面步骤 + 一句话背景，越全分析越准)</label><textarea id="m_body" placeholder="# 题目原文&#10;...&#10;&#10;# 学生的卷面步骤&#10;...&#10;&#10;# 一句话背景&#10;..."></textarea>
  <div class="modal-foot"><button class="cancel btn" onclick="closeModal()">取消</button><button class="btn" onclick="submitMistake(this,'\${id}')">提交到 inbox</button></div>\`;M.classList.add('show')}
async function submitMistake(btn,id){try{if(!m_body.value.trim())return alert('错题内容不能为空');btn.innerHTML='<span class=spin></span>提交中';btn.disabled=1;
  await api('/api/mistake',{student:id,subject:m_subj.value,content:m_body.value});
  toast('已进 inbox，点「跑分析」出结果');setTimeout(()=>location.reload(),700)}catch(e){alert(e.message);btn.innerHTML='提交到 inbox';btn.disabled=0}}
async function doOcr(btn){const files=document.getElementById('m_imgs').files;if(!files.length)return alert('先选照片');
  const old=btn.innerHTML;btn.innerHTML='<span class=spin></span>识别中…';btn.disabled=1;
  try{const imgs=await Promise.all([...files].map(f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})));
    const d=await api('/api/ocr',{images:imgs});document.getElementById('m_body').value=d.text||'';
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
function readBody(req) { return new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 30e6) req.destroy(); }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(e); } }); }); }

const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${HOST}`);
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) return send(res, 200, renderHTML());

    if (req.method === 'GET' && u.pathname === '/api/file') {
      const { student, day, name } = Object.fromEntries(u.searchParams);
      if (!SAFE(student) || !SAFE(day.replace(/-/g, ''))) return send(res, 400, 'bad params', 'text/plain');
      const fname = decodeURIComponent(name || '');
      const p = resolve(STUDENTS, student, 'outbox', day, fname);
      if (!p.startsWith(resolve(STUDENTS) + '/') || !existsSync(p)) return send(res, 404, 'not found', 'text/plain');
      return send(res, 200, readFileSync(p, 'utf8'), 'text/plain; charset=utf-8');
    }

    if (req.method === 'POST' && u.pathname === '/api/student') {
      const b = await readBody(req);
      if (!SAFE(b.id)) return send(res, 400, JSON.stringify({ error: '学号只能用英文/数字/-/_' }), 'application/json');
      const dir = join(STUDENTS, b.id);
      if (existsSync(dir)) return send(res, 400, JSON.stringify({ error: '该学号已存在' }), 'application/json');
      mkdirSync(join(dir, 'inbox'), { recursive: true }); mkdirSync(join(dir, 'archive'), { recursive: true }); mkdirSync(join(dir, 'outbox'), { recursive: true });
      const profile = `---\nid: ${b.id}\nname: ${b.name || b.id}\ngrade: ${b.grade || ''}\nsubjects: [${b.subjects || 'math'}]\nauthorized: true\nauthorized_by: 监护人（${today()} 网页建档）\n---\n\n# 学习画像\n\n${b.bio || '（待补充）'}\n`;
      writeFileSync(join(dir, 'profile.md'), profile);
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    }

    if (req.method === 'POST' && u.pathname === '/api/mistake') {
      const b = await readBody(req);
      if (!SAFE(b.student) || !existsSync(join(STUDENTS, b.student))) return send(res, 400, JSON.stringify({ error: '学生不存在' }), 'application/json');
      if (!b.content || !b.content.trim()) return send(res, 400, JSON.stringify({ error: '错题内容为空' }), 'application/json');
      const subj = SUBJ[b.subject] ? b.subject : 'math';
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const file = join(STUDENTS, b.student, 'inbox', `web-${ts}.md`);
      writeFileSync(file, `---\nsubject: ${subj}\nsource: 网页提交 ${today()}\n---\n\n${b.content}\n`);
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    }

    if (req.method === 'POST' && u.pathname === '/api/run') {
      const b = await readBody(req);
      if (!SAFE(b.student) || !existsSync(join(STUDENTS, b.student))) return send(res, 400, JSON.stringify({ error: '学生不存在' }), 'application/json');
      const child = spawn(process.execPath, [join(ENGINE_DIR, 'night-run.mjs'), '--student', b.student], { cwd: ROOT, env: { ...process.env, K12_ROOT: ROOT } });
      let out = '';
      child.stdout.on('data', d => out += d); child.stderr.on('data', d => out += d);
      child.on('close', code => {
        const ok = code === 0 && /完成|收工/.test(out);
        const summary = (out.match(/✓ .*完成[^\n]*/) || out.match(/✗[^\n]*/) || [''])[0].trim();
        send(res, ok ? 200 : 500, JSON.stringify(ok ? { ok: true, summary } : { error: summary || ('退出码 ' + code) }), 'application/json');
      });
      return;
    }

    if (req.method === 'POST' && u.pathname === '/api/ocr') {
      const b = await readBody(req);
      const imgs = Array.isArray(b.images) ? b.images.filter(s => typeof s === 'string' && s.startsWith('data:image')) : [];
      if (!imgs.length) return send(res, 400, JSON.stringify({ error: '没有有效图片' }), 'application/json');
      let cfg; try { cfg = getCfg(); } catch (e) { return send(res, 500, JSON.stringify({ error: e.message }), 'application/json'); }
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
  } catch (e) { send(res, 500, JSON.stringify({ error: e.message }), 'application/json'); }
});

server.listen(PORT, HOST, () => console.log(`K12 控制台已启动：http://${HOST}:${PORT}（仅本地，需 SSH 隧道访问）ROOT=${ROOT}`));
