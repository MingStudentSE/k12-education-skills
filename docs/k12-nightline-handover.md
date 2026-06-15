# K12 错题分析产线 — 当前仓库运行手册

> 版本：2026-06-15 仓库整合版 · 状态：可运行，需自配 API Key
> 本文说明当前仓库的夜间错题分析运行层，已适配当前 60 个 Skill 体系。

## 0. 一句话

晚上学生交错题，夜里 LLM 按本仓库 K12 教学技能分析，早上产出「错因诊断 / 变式训练题 / 答案与讲解 / 晨报」四件套。数据层是纯文件夹（vault 兼容），引擎是确定性 Node 脚本，模型只在分析那一步介入。

## 1. 你拿到了什么

```
当前仓库/
├── docs/k12-nightline-handover.md  ← 你正在读的这份（主入口）
├── engine/
│   ├── night-run.mjs        ← 夜间产线引擎（无外部依赖，只用 Node 内置 + fetch）
│   ├── build-dashboard.mjs  ← 静态看板生成器（路线 A，离线单文件 dashboard.html）
│   ├── server.mjs           ← 交互式控制台（路线 B，新建学生/交错题/跑分析/看产出，只绑 127.0.0.1）
│   ├── config.sample.json   ← 配置模板（复制成 config.json 填你自己的 key）
│   └── config.json          ← 你自己建，已被 .gitignore（不在包里，需自己配）
├── skills/                  ← 当前 60 个 K12 教学技能
│   ├── general/ chinese/ math/ english/ physics/
│   └── history/ geography/ politics/ chemistry/ biology/
├── pipeline/                ← 产线方法论（你要扩技能/判质量时用）
│   ├── CLAUDE_GUIDE_K12_v2.md   ← 规则单一来源（鲁班五动作 + 班规）
│   ├── review.sh                ← 自动判卷五件套（瘦身质量门）
│   ├── EXAM_CLOSED_BOOK.md      ← 闭卷考场规程 + 题库（性能回归考）
│   └── REVIEW_K12_002/003/004.md ← 三轮终审判卷记录（参考标准）
├── students/
│   └── _template/           ← 空学生模板，复制成 stu-001 等
│       ├── profile.md       ← 学习画像（引擎每晚读）
│       └── inbox/sample-mistake.md  ← 错题样例（删掉换真题）
└── docs/
    └── k12-nightline-guide.md ← 给学生/家长的使用指南 + 给运营者的说明
```

## 2. 怎么跑起来（5 步）

1. **装 Node**（≥18，要自带 `fetch`）。`node -v` 确认。
2. **配 key**：`cp engine/config.sample.json engine/config.json`，填四项：
   - `apibase`：任意 OpenAI 兼容端点（`/v1`），例如你自己的中转
   - `key`：你自己的 API key（**包里没有任何 key，必须自填**）
   - `model`：建议高档位推理模型
   - `skillsDir`：留空即用当前仓库 `skills/`；指向别处可换技能库
3. **建一个学生**：`cp -r students/_template students/stu-001`，编辑 `profile.md`。
4. **放错题**：把真实错题写成 `.md` 丢进 `students/stu-001/inbox/`（格式见样例，三要素：题目原文 / 学生卷面步骤 / 一句话背景）。删掉 `sample-mistake.md`。
5. **跑**：`node engine/night-run.mjs --student stu-001`（无 `--student` = 全员）。
   产出在 `students/stu-001/outbox/<日期>/`，错题档案进 `archive/`，原件归档到 `inbox/processed/`。

**看板**：`node engine/build-dashboard.mjs` 扫所有学生，在包根生成 `dashboard.html`（零依赖单文件，浏览器/Obsidian 直接开）。首屏是学生卡片，🔴 高亮已触发专项的顽固弱项（recurrence_count≥3），展开看弱项分布和最近产出。`dashboard.html` 是运行产物，已 .gitignore。

**交互式控制台（路线 B，可选）**：`node engine/server.mjs` 启动后端服务，浏览器里就能新建学生、交错题、一键跑分析、在线看产出，不用碰命令行。
- **拍照转写（OCR）**：交错题时可上传错题照片，复用 config 里的模型转写成「题目原文 / 学生卷面步骤逐字 / 批注」三段填入。无需额外 OCR 服务。转写后**必须人工核对手写步骤再提交**（手写识别不完美 + 卷面步骤不准纠错）。
- **安全铁律**：服务只绑 `127.0.0.1`，**必须经 SSH 隧道访问**，公网不可见（因为它能写数据+触发付费 LLM）。本机：`ssh -L 18350:localhost:18350 <server>`，然后开 `http://localhost:18350`。
- 固化：可用 systemd `k12-console.service`（`Restart=always`，开机自启），工作目录指向当前仓库或你的部署目录；真实学生目录与 `config.json` 都不入库。
- 要给非技术的人/家长用，再单独加鉴权或反代，别直接把端口绑 0.0.0.0。

**自动化**：原产线用 cron 每日 01:30 跑全员。交接版你自己决定是否挂 cron（建议夜跑后顺手刷看板）：
```
30 1 * * * cd /path/to/k12-education-skills && node engine/night-run.mjs >> logs/cron.log 2>&1 && node engine/build-dashboard.mjs >> logs/cron.log 2>&1
```

## 3. 核心机制（接手人必懂的三点）

1. **顽固弱项专项**：引擎把 `archive/` 最近 6 条历史喂给模型，同根因错误累计 ≥3 次会触发「专项突破」——把两次历史错因定制成变式题。这是产线的灵魂，不是普通刷题。
2. **离线追问改写**：技能里「先追问学生」的环节，在批处理模式下改成「列出最想问的 2 个追问 + 基于证据的最可能答案」（没有对话机会）。
3. **四节切分**：模型输出用 `<<<DIAGNOSIS>>>` / `<<<ARCHIVE>>>` / `<<<PROBLEMS>>>` / `<<<SOLUTIONS>>>` 标记分段，引擎按标记切文件；缺任一节直接报错（防半成品）。

## 4. 怎么扩 / 怎么判质量（动技能时才看）

- **改/加技能**：先读 `pipeline/CLAUDE_GUIDE_K12_v2.md`（规则单一来源）。瘦身铁律：主文件 ≤150 行，长内容进 `references/`，SKILL.md 引用的文件必须真实存在（指针真实性）。
- **判瘦身质量**：`bash pipeline/review.sh [学科|all]`，输出行数/悬空引用/JSON/关键词覆盖/锚点反查。规则：关键词丢失 <5% = 搬家型放行；≥5% = 重写型需人工实读定罪。
  当前 `pipeline/review.sh` 已改成相对当前仓库运行；如果没有旧基线，只跑行数、引用和 JSON 基础门。如果要做关键词覆盖与锚点反查，把旧版放到 `backup-pre-fix/` 或设置 `K12_BASELINE=/path/to/baseline`。
- **判教学性能**：`pipeline/EXAM_CLOSED_BOOK.md` 是闭卷考场，新旧同题干净会话对跑，看四维（追问不代写 / 错因点名 / 招牌机制 / 授权红线）是否退化。改产线前后各跑一次防越改越差。

## 5. 边界与安全

- **包里没有任何密钥**。`config.json` 需自建，已加入 `.gitignore`。
- **技能内容版权**：`skills/` 源自当前仓库内容。再分发请遵循本仓库 LICENSE。
- **学生隐私**：建档需监护人书面授权（`profile.md` 的 `authorized_by` 字段留痕）。报告里禁用「粗心/不认真/笨」这类无教学信息量的词。
- **运行回路 vs 进化回路**：每晚出活的运行回路保持确定性脚本，**绝不交给模型自进化**；只有迭代产线本身（改技能）才用 AI，且改动必须过 §4 的质量门。

## 6. 这个包不含什么

- API key / 私人中转配置（密钥，故意排除）
- `backup-pre-fix/` 原版冻结基线（review.sh 的对比基准，约几 MB，需要再瘦身时另要）
- 真实学生数据（stu-001 是演示档，未含真人）
- 真实学生数据（只保留 `students/_template`）

## 7. 下一步路线（原作者拍板，供接手人参考）

- **数据控制台**（view 层）：✅ 已建（路线 A 静态 HTML，`engine/build-dashboard.mjs`；路线 B 本地控制台，`engine/server.mjs`）。
- **OCR 接料**：✅ 路线 B 已支持通过视觉模型转写图片，提交前必须人工核对手写步骤。
- **多学生并发节流**。
- Obsidian 插件定位为「绑定用户自装 CLI 的薄壳」，不打包 CLI。
