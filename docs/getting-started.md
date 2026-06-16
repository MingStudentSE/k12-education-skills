# 🚀 快速上手与使用指南

> 面向第一次接触本仓库的学生、家长和运营者。
> 本文档是**入口前门**：用决策树把三条使用路径串起来，给出当前正确的 Claude Code / Codex CLI 安装步骤。
> 各路径的**详细操作**在专门的文档里，本文只做交叉引用，不重复。

本仓库是 **K12 教育 AI 辅导系统 v2.0**：60 个学习/学科 Skill + 一套可本地运行的夜间错题产线。它不是"给答案的计算器"，而是"追问思路、陪你复盘、帮你形成长期学习系统"的教练。

---

## 开始之前：把仓库弄到本地

三条路径都要先把仓库克隆到本地，后续命令默认在仓库根目录 `k12-education-skills/` 下执行：

```bash
git clone https://github.com/MingStudentSE/k12-education-skills
cd k12-education-skills
```

没装 git：macOS 跑 `xcode-select --install`，Windows 装 Git for Windows。
路径 A、B 还需要你的 AI 助手能读到这个仓库——详见各路径里的"怎么让 AI 看到这些 Skill"。

---

## 0. 先选你的路径

三条路径**可以组合**（比如 A 当日常陪学 + C 跑夜间批处理，B 决定产出落到哪）。

| 我想做什么 | 走哪条 | 要不要装 Skill 到本地 AI | 要不要配 API key |
| --- | --- | --- | --- |
| 让 AI 日常陪我学某学科（错题、费曼、复盘…） | **A 只用 Skill** | 要 | 不要 |
| 把学习沉淀接进我的 Obsidian 笔记库 | **B 接入 Obsidian** | 要 | 不要 |
| 睡前批量交错题，早上出诊断 + 变式题 + 讲解 + 晨报 | **C 跑夜间产线** | 不必（引擎直接读仓库 `skills/`） | **要** |

- 路径 A、B：你把需要的 Skill 装进 AI 助手（Claude Code / Codex CLI），由 AI 在对话里使用。
- 路径 C：你不和 AI 对话，而是把错题丢进文件夹，引擎在夜里调模型批量分析。它把仓库自带的 60 个 Skill 当作"技能库"读取，所以本地 AI 不必再装一遍。

下文 1 先选 AI 端；2/3/4 分别讲 A/B/C；5 讲三者的串联。

---

## 1. 选你的 AI 端 + Skill 放哪

> 本节只对路径 A、B 有用。路径 C 跳到第 4 节。

Skill 的安装单位是**单个目录**：保留 `SKILL.md` + `references/` + `schemas/`（如有）+ `assets/`（如有），**不要只复制 `SKILL.md`，不要拆散目录**。两端都遵循同一套开放 skill 标准，仓库的 Skill 结构无需改动，放进各自平台的发现目录即可。

### Claude Code

- 项目级位置：`.claude/skills/<skill-name>/SKILL.md`（放好后自动发现）。
- 也可以放用户级：`~/.claude/skills/<skill-name>/`。

### Codex CLI

- 项目级位置：`.agents/skills/<skill-name>/SKILL.md`（Codex 从当前目录向上扫到仓库根，逐层发现 `.agents/skills/`）。
- 用户级：`~/.agents/skills/`；机器级：`/etc/codex/skills/`。
- ⚠️ **重要**：Codex 旧的 `~/.codex/prompts/` 自定义提示词已在 0.89.0 **弃用**，迁移到 skills；当前 skills 在 `.agents/skills/` 发现，**不是** `.codex/skills/`。
- 用 `/skills` 或输入 `$` 可以显式调用某个 skill；Codex 也会按 `description` 自动选用。
- **上下文预算**：Codex 初始只载入各 skill 的 name/description（约 2% 上下文 / 8000 字符上限），装太多会截短描述甚至省略并告警——所以**不要一次装全 60 个**，按需装。

> 安装路径以你所用平台的当前文档为准。两边都是"目录里放 SKILL.md 即可被加载"。

---

## 2. 路径 A：只用 Skill（日常陪学）

**目标**：先跑通最小学习闭环"错题 → 复习 → 验证 → 复盘"。

### 2.1 装核心联动套件（7 个）

> ⚠️ **别只装"五件套"。** 仓库其他文档把**核心五件套**（学习DNA / 错题本 / IM提醒 / 费曼 / 周复盘，5 个）作为 phase-1 起步，但它们单独跑是 **5 个孤岛**——飞轮里"知识沉淀"和"联动"两个节点没人接。要让它们真正闭环，建议直接装**核心联动套件（7 个）**：五件套 + 康奈尔笔记（知识沉淀）+ skill-coordinator（联动胶水）。理科生再加**理科解题四步法**（单题掌握），共 8 个。

**怎么让 AI 看到这些 Skill**：在你的项目目录（或仓库目录）里开 Claude Code / Codex CLI，把下面这段发给它——AI 会把对应 skill 目录复制进 `.claude/skills/`（或 `.agents/skills/`），你一般不用手动操作。想手动装也行：`cp -r skills/general/<name> .claude/skills/`。

把下面这段发给你的 Claude Code / Codex CLI：

```text
请从这个仓库获取 Skill：
https://github.com/MingStudentSE/k12-education-skills

安装核心联动套件（7 个，构成完整学习闭环）：
1. skills/general/learning-dna/
2. skills/general/correction-notebook/
3. skills/general/im-reminder/
4. skills/general/feynman-learning/
5. skills/general/weekly-review/
6. skills/general/cornell-notes/
7. skills/general/skill-coordinator/
（理科生再加：skills/general/science-solving-four-steps/）

每个 SKILL 都以单个目录为安装单位，请保留 SKILL.md、references/、schemas/、assets/ 等配套文件。
请装到当前项目的项目级 Skill 位置（Claude Code 用 .claude/skills/，Codex CLI 用 .agents/skills/），不要拆散 Skill 目录。
```

| # | Skill | 在闭环里的角色 |
| --- | --- | --- |
| 1 | 学习DNA | 长期档案底座（需你授权才建） |
| 2 | 智能错题本 | 从"保存题目"升级为"定位错因" |
| 3 | IM智能提醒 | 复习/计划/回访放进真实节奏 |
| 4 | 费曼学习法 | 验证是真懂还是假懂 |
| 5 | 每周学习复盘 | 过程沉淀成周报和成长线索 |
| 6 | 康奈尔笔记 | 错题/概念沉淀成可复用知识（飞轮"知识沉淀"节点） |
| 7 | skill-coordinator | 联动胶水：跨 skill 学习区校准 + 全景月报 + 系统健康检查 |
| + | 理科解题四步法 | 理科生专属：单题拆解→迁移→复测（飞轮"单题掌握"节点） |

**装完之后，第一句话跟 AI 说什么**（任选一个起步）：

- "我有道错题，帮我用智能错题本分析错因。" → 触发错题本定位错因
- "用费曼学习法考我：X 这个概念，我先讲一遍，你来挑刺。" → 触发费曼验证真懂
- "我想建立学习DNA 档案，我授权你记录我的学习风格和弱项。" → 触发学习DNA（授权后才会建）
- "用康奈尔笔记法帮我把这道错题整理成可复习的知识卡。" → 触发康奈尔沉淀

> 这 7 个 skill 才是架构定义的"核心飞轮"：错题本找错因 →（理科生用四步法把题拆透）→ 费曼验真懂 → 康奈尔笔记沉淀 → IM 提醒复习 → 周复盘看趋势，coordinator 在背后做学习区校准和月报。先跑通一次"错一道题 → 定位错因 → 用自己的话讲一遍 → 沉淀成笔记 → 周末复盘"就算闭环了。

### 2.2 按需加装学科专项

哪门学科痛，就加哪门（每门 5 个）。例如数学痛 → 装 `skills/math/` 下 5 个（`math-problem-solving-coach`、`math-error-dna`、`math-concept-explainer`、`math-word-problem-coach`、`math-gradient-trainer`）。**不要为了凑数全装**。完整分阶段顺序和轻度/中度/重度组合见 [安装指南](installation-guide.md)。

---

## 3. 路径 B：接入 Obsidian 笔记库

**目标**：让 Skill 的产出（错题卡、概念、周报、画像）落到你自己的 Obsidian vault，而不是散落在对话里。

> **前置（重要）**：`educational-llm-wiki` 这个 skill 在本仓库里，执行下面的 prompt 前，先确保 AI 能读到仓库——**在仓库目录 `k12-education-skills/` 里开 AI**（不要在你的 Obsidian vault 目录里开，否则 AI 看不到 `skills/...` 这个相对路径，prompt 直接失效）。
>
> **AGENTS.md 是什么**：放在 vault 根目录的一份规则文件，告诉 AI"这个仓库怎么读写、各类产出写到哪个目录"。它是本路径的"本地宪法"。

### 3.1 先装并使用 `educational-llm-wiki`

它是 Obsidian 接入的**总入口**，负责判断你的 vault 是哪种状态，再决定怎么接。装它：

```text
skills/general/educational-llm-wiki/
```

然后让 AI 用它判断（可直接发给 AI）：

```text
请安装并使用 skills/general/educational-llm-wiki/，帮我判断当前 Obsidian 笔记库是哪种状态（空仓库 / 已有结构 / 成熟定制仓库，三选一）。
先报告你判断的档位和理由，等我确认后再动手，不要一步到位：
- 空仓库：用 assets/vault-template 在 vault 根新建 100-Raw / 200-Wiki / 300-Output 三个空目录（不移动任何已有文件）+ 创建 AGENTS.md。
- 已有结构：不要覆盖或搬空旧笔记，先整理现有目录用途，再给出 K12 Skill 的写入映射。
- 成熟定制仓库：禁止套数字前缀模板，服从本地路由，只追加索引和路由。
检查目标仓库是否已有 AGENTS.md：如果没有，请新建；如果已经有了，只追加必要规则。
```

### 3.2 三种 vault 状态的处理

| vault 状态 | educational-llm-wiki 怎么做 |
| --- | --- |
| 空仓库 | 用 `assets/vault-template/` 建 `100-Raw / 200-Wiki / 300-Output` 三层 + 放 `AGENTS.md` |
| 已有结构（有笔记/目录） | **不覆盖、不搬空**：先盘点现有目录用途，把现有目录映射成"原始证据/编译知识/输出成果"三类，再追加 K12 写入映射和 `AGENTS.md` 规则片段 |
| 成熟定制仓库（AGENTS.md > 50 行 / 上千文件 / 语义命名） | **禁止套数字前缀模板**：服从本地顶层路由，只追加索引和路由，不改名、不移动笔记（路径重命名曾造成断链事故） |

> 详细操作见 [AI 用 Obsidian 仓库接入手册](AI-obsidian-integration-manual.md)；架构规范见 [Obsidian 学习仓库架构](obsidian-vault-architecture.md)；可复制到 vault 根的 `AGENTS.md` 模板见 [AGENTS.k12-learning-vault.template.md](AGENTS.k12-learning-vault.template.md)。

### 3.3 接 Obsidian 时优先装哪些 Skill

`educational-llm-wiki` + 核心联动套件（路径 A §2.1 那 7 个）起步；学科专项只在痛点明确时加。**不要一次启用全部 60 个**（除按需外，Codex 还有上下文预算约束，见第 1 节）。

---

## 4. 路径 C：跑夜间错题产线（配 API key）

**目标**：把仓库当成本地批处理系统——睡前交错题，夜里模型按 60 个 Skill 分析，早上出"错因诊断 / 变式训练题 / 答案讲解 / 晨报"四件套。同根因错误累计 ≥3 次还会触发"顽固弱项专项"。

> 这条路径**不需要**把 Skill 装进本地 AI——引擎直接读仓库的 `skills/` 作为技能库。需要一台装了 Node 的机器和**你自己的 API key**（仓库里不含任何密钥）。

### 4.1 五步跑起来

```bash
# 1) 配置：复制模板，填你自己的端点和 key（仓库不含任何密钥）
cp engine/config.sample.json engine/config.json
#    编辑 engine/config.json，填三项必填（skillsDir 一般留空）：
#      apibase  = 你的 OpenAI 兼容端点（以 /v1 结尾），如官方 OpenAI 或自建中转
#      key      = 你的 API key（sk-...）
#      model    = 你 key 对应的模型名（sample 里的 gpt-5.5 只是示例，换成你自己用的）
#      skillsDir 留空 = 用本仓库 skills/；指向别处可换技能库
#    ⚠️ 不创建 config.json 会直接报错；填了占位 key 会 HTTP 报错——这两类都会明显失败。
#       唯一会"静默成功"的情况是误留 K12_MOCK_LLM=1，那时产出带 "Mock" 字样，不是真实诊断。

# 2) 建一个学生（复制模板）
cp -r students/_template students/stu-001
#    编辑 students/stu-001/profile.md：authorized_by 填"监护人（YYYY-MM-DD 书面同意建档）"留授权痕迹

# 3) 放错题：照着 inbox/sample-mistake.md 的格式写真实错题 .md（写完可删掉 sample）
#    frontmatter 的 subject 用英文小写：math/physics/chinese/english/history/geography/politics/chemistry/biology
#    正文三段（文件名即"题名"，会出现在产出文件名里）：
#      # 题目原文
#      # 学生的卷面步骤（错的过程比错的答案值钱，原样照抄）
#      # 一句话背景（学生当时怎么想 / 老师批了什么）

# 4) 夜跑（单人；不带 --student = 扫全部学生）
node engine/night-run.mjs --student stu-001
#    产出在 students/stu-001/outbox/<日期>/ 下：
#      <题名>-错因诊断.md、<题名>-变式训练题.md、<题名>-答案与讲解.md、晨报.md
#    错题档案归档到 archive/，原件移到 inbox/processed/

# 5) 看板 / 控制台（二选一）
node engine/build-dashboard.mjs          # 路线A：生成零依赖单文件 dashboard.html，浏览器/Obsidian 直接开
node engine/server.mjs                    # 路线B：起 127.0.0.1:18350 交互控制台（建学生/交错题/跑分析/拍照OCR）
```

路线 B 的控制台**只绑 127.0.0.1**，远程访问必须走 SSH 隧道（`ssh -L 18350:localhost:18350 <user>@<host>`，本地开 http://127.0.0.1:18350），**不要绑 0.0.0.0**。OCR 转写可上传错题照片，但**手写步骤必须人工核对再提交**。

### 4.2 自动化与边界

- 可挂 cron 每天夜里跑全员，顺手刷看板（示例见 [产线运行手册](k12-nightline-handover.md)）。
- **安全**：`engine/config.json`、`students/*`（保留 `_template`）、`logs/`、`dashboard.html` 全部 `.gitignore`，不进版本控制；建档需监护人书面授权（`profile.md` 的 `authorized_by`）；报告禁用"粗心/不认真/笨"这类无信息量的词。
- **运行回路不交给模型自进化**：每晚出活的是确定性脚本；只有迭代产线本身（改 Skill）才用 AI，且改动必须过 `pipeline/review.sh` 质量门。

> 完整运行边界、隐私边界和质量门见 [K12 错题分析产线运行手册](k12-nightline-handover.md)；给学生/家长的使用说明见 [K12 夜间错题分析使用文档](k12-nightline-guide.md)。

---

## 5. 串联场景（educational-llm-wiki → 配 key → 夜跑）

三者最完整的样子是这样闭环：

```text
① educational-llm-wiki 先搭好 Obsidian vault（三层结构 + AGENTS.md 写入映射）
        │
        ↓  vault 的 100-Raw/40-错题原始材料/ 就是夜跑的 inbox 来源
② 配 engine/config.json（apibase/key/model）
        │
        ↓  把当天错题 .md 丢进 students/<id>/inbox/
③ node engine/night-run.mjs 出四件套
        │
        ↓  产出回写到 vault：错因进 200-Wiki/30-错因模式/，周报/晨报进 300-Output/
④ node engine/build-dashboard.mjs 看板，或起 server.mjs 交互查看
```

即：**Obsidian 管"原始证据 + 沉淀知识 + 交付成果"的分层，夜跑引擎管"按 Skill 批量分析并产出"**。两者通过纯文件夹天然互通（`dashboard.html` 在 Obsidian 里也能直接开）。

---

## 6. 常见问题与红线

- **不知道先装什么** → 核心联动套件 7 个（路径 A §2.1）。先把"错题 → 复习 → 验证 → 复盘"跑通一次再说。
- **能不能一次装全 60 个** → **不建议**。一是按需加装，二是 Codex 初始 skills 清单有上下文预算上限，装太多会被截短/省略。
- **没有 API key 能不能跑夜跑** → 能做语法/流程验证：`K12_MOCK_LLM=1 node engine/night-run.mjs --student demo` 走 mock，不调真实模型；但要出真实诊断必须自配 key。
- **环境要求** → Node ≥ 18（要用内置 `fetch`）；引擎零 npm 依赖，纯内置模块。
- **最小授权红线** → 不经同意不建长期档案、不发提醒、不跨 Skill 共享；用户随时可要求"不记忆/不提醒/不共享"。详见 [SECURITY_BASELINE.md](../SECURITY_BASELINE.md)。
- **AI 辅助思考，不用 AI 替代思考** → 所有 Skill 共同铁律。

---

## 📚 下一步

- 装机分阶段顺序、按包上架、推荐组合 → [安装指南](installation-guide.md)
- 60 个 Skill 全清单、协作飞轮、方法论 → [系统架构与方法论](architecture.md)
- Obsidian 适配详细操作 → [AI 用 Obsidian 仓库接入手册](AI-obsidian-integration-manual.md)
- 夜间产线完整运行手册 → [K12 错题分析产线运行手册](k12-nightline-handover.md)
