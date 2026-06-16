# 🎓 K12 教育 AI 辅导系统

> 适用平台：OpenClaw / ClawHub / SkillHub
> 当前仓库聚焦 **K12 学习场景 60 个 SKILL**，覆盖通用学习系统与语文、数学、英语、物理、历史、地理、政治、化学、生物九大学科专项。

传统的 AI 往往被当成“给答案的计算器”。
这套 K12 教育 AI 辅导系统希望把 AI 变成“追问思路、陪你复盘、帮你形成长期学习系统的教练”。

---

## ✨ v2.0 重点变化

- 完成工程化运行层：新增夜间错题分析、静态看板、交互式控制台、学生档案模板和质量门。
- 全仓 60 个 Skill 均采用“短 `SKILL.md` + 本地 `references/` 细则”的可安装结构，主文件控制在 150 行以内。
- 夜间产线按学生 `inbox/` 批处理错题，产出错因诊断、错题档案、变式训练题、答案讲解和晨报。

## ✨ v1.6 重点变化

- 新增 **化学、生物** 两门理科/生命科学学科专项，各 5 个 SKILL（共 10 个），仓库 SKILL 总数 50 → 60。
- 化学专项建立“宏观现象 → 微观粒子 → 符号表达”第一步铁律，覆盖微粒观、概念理解、反应方程式、实验探究和化学错误DNA。
- 生物专项建立“结构层级 → 功能过程 → 调节关系”第一步铁律，覆盖结构功能、概念图谱、生命过程、实验探究和生物错误DNA。
- 两门新增学科均保持单个 SKILL 独立安装边界：运行时参考材料全部放在各自 `references/` 目录中。

## ✨ v1.5 重点变化

- 新增 **政治、历史、地理** 三门文综学科专项，各 5 个 SKILL（共 15 个），补齐 K12 文综版图，仓库 SKILL 总数 35 → 50。
- 三学科均按物理五件套五元结构设计（地基 / 概念 / 方法论 / 高阶能力 / 错误DNA），学科独有第一步铁律：历史"先定位时空"、地理"无图不题先读图"、政治"先定位理论模块"。
- 高阶能力位重新设计（非机械迁移物理实验）：历史史料实证、地理过程推理、政治价值推理论证。
- 架构层扩展：`handover-protocol.schema.json` 与通用错题本向后兼容支持政史地（H/G/Po 五维错因 + §9.4/9.5/9.6 协作协议）。
- **价值观合规红线**：政史地价值维度一律用能力描述（"价值论证缺失"），只训练论证构建，绝不评判学生立场；写入每个 SKILL 禁止行为表与 `SECURITY_BASELINE.md`。
- 全程 codex(gpt-5.5/xhigh/fast) 生成 + 教育部课标网络核实 + darwin-skill 8 维度评分优化（三学科平均 87.7）。

## ✨ v1.4 重点变化

- 新增 `educational-llm-wiki`，把 Obsidian/Markdown 学习仓库接入从“文档指导”升级为可安装 Skill。
- 内置教育版 `100-Raw / 200-Wiki / 300-Output` 三层 vault 模板，支持空仓库搭建、已有仓库映射、资料编译、检查安装官方 Obsidian skills、索引日志维护和健康检查。
- 建立根目录 `references/` 理论库，采用“一个理论一个笔记”的维护方式。
- 将 12 个认知原理、学习区、85/15 意外挑战、主动回忆、错误反馈、交错练习、分散练习等理论写入核心 SKILL 设计约束。
- 恢复并重命名 `skill-creator` 为 `educational-skill-creator`，专门用于创建教育类 SKILL。

---

## 📦 包含模块

当前仓库按学生使用场景分为两大层：

### 通用与成长层（`skills/general/`）· 15 个 SKILL

- **核心五件套**：学习DNA、智能错题本、IM智能提醒、费曼学习法、每周学习复盘
- **知识库与方法论包**：教育LLM知识库、教育版SKILL创建教练、康奈尔笔记、SKILL联动协调器、理科解题四步法
- **自我管理与探索包**：30天学习计划制定师、时间与专注力教练、跨学科侦探周、兴趣成长探索计划
- **可选高级复盘**：阶段学习体检，用于证据化 360 复盘和阶段系统修复
- **学习科学底座**：用 12 个认知原理、学习区、约85%熟悉内容 + 15%意外挑战、间隔复习、主动回忆、错误反馈和交错练习校准所有教育 SKILL

### 学科专项层（`skills/{subject}/`）· 45 个 SKILL

- **语文**（5 个）：写作、阅读、文言文、素材积累、语病纠偏
- **数学**（5 个）：解题、错误DNA、概念解释、应用题建模、思维梯度训练
- **英语**（5 个）：口语、词汇DNA、语法、听力、写作
- **物理**（5 个）：解题、错误DNA、概念直觉、物理建模、实验思维
- **历史**（5 个）：时空观教练、因果解释器、史料实证分析、解题教练、错误DNA
- **地理**（5 个）：读图定位教练、区域分析教练、过程机制解释器、解题教练、错误DNA
- **政治**（5 个）：知识体系教练、概念理解器、理论联系实际教练、价值推理教练、错误DNA
- **化学**（5 个）：微粒观建模、概念理解、反应方程式、实验探究、错误DNA
- **生物**（5 个）：结构功能、概念图谱、生命过程、实验探究、错误DNA

---

## 📊 状态总览

| 类别     | 数量     | 状态               |
| ------ | ------ | ---------------- |
| 通用与成长层 | 15     | ✅ v2.0 可用 |
| 学科专项层  | 45     | ✅ v2.0 可用 |
| **总计** | **60** | **100% 可用**      |

### 安装包边界

每个 SKILL 都按“单个目录可独立安装”的方式维护。  
如果某个 SKILL 需要参考材料、schema 或模板，这些文件必须放在该 SKILL 自己的 `references/`、`schemas/` 或 `assets/` 目录下，不能依赖仓库根目录的共享文件。

根目录 `references/` 用于保存仓库级理论依据和原始资料，例如 12 个认知原理、学习区定义、85/15 意外挑战、费曼、康奈尔、波利亚、艾宾浩斯等理论索引；这些文件按“一个理论一个笔记”维护，是设计和迭代依据，不作为单个 SKILL 的运行时依赖。

---

## 🚀 快速开始

> ⚠️ 建议先安装核心 SKILL，再按实际学科痛点加装专项 SKILL；不要一开始把全部 60 个都装上。

### 1. 让 Agent 安装核心联动套件

> 别只装"五件套"。核心五件套（学习DNA / 错题本 / IM提醒 / 费曼 / 周复盘，5 个）单独跑是 5 个孤岛——要让它们真正联动成"错题→沉淀→验证→复习→复盘"的闭环，建议直接装**核心联动套件（7 个）**：五件套 + 康奈尔笔记（知识沉淀）+ skill-coordinator（联动胶水）。理科生再加理科解题四步法。完整说明见 [快速上手与使用指南](docs/getting-started.md)。

把下面这段话发给你的 Claude Code / Codex / Work Buddy 等 Agent：

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

如果我要接入 Obsidian 或本地 Markdown 学习仓库，请额外安装：

8. skills/general/educational-llm-wiki/

每个 SKILL 都以单个目录为安装单位。请保留每个目录内的 SKILL.md、references/、schemas/、assets/ 等配套文件。不要安装全部 60 个 SKILL；后续等我明确需要某个学科专项、高级复盘或方法论工具时再加装。

请把这些 Skill 安装到当前项目的项目级 Skill 位置：Claude Code 用 .claude/skills/、Codex CLI 用 .agents/skills/（注：Codex 旧的 .codex/prompts/ 已弃用，当前 skills 在 .agents/skills/ 发现），或你支持的项目级 Skill 管理器。安装方式以你的平台为准，但不要拆散 Skill 目录。
```

### 2. 核心联动套件顺序

1. [🧬 学习DNA](skills/general/learning-dna/)：建立长期学习档案的授权底座
2. [❌ 智能错题本](skills/general/correction-notebook/)：从“保存题目”升级为“定位错因”
3. [⏰ IM智能提醒](skills/general/im-reminder/)：把复习、计划和回访放进真实节奏
4. [🎓 费曼学习法](skills/general/feynman-learning/)：验证到底是真懂还是假懂
5. [📊 每周学习复盘](skills/general/weekly-review/)：把过程沉淀成周报和成长线索
6. [📝 康奈尔笔记](skills/general/cornell-notes/)：把错题和概念沉淀成可复用知识
7. [🔗 SKILL联动协调器](skills/general/skill-coordinator/)：跨 SKILL 学习区校准、全景月报、系统健康检查

### 3. 先让 AI 用教育 LLM Wiki 判断仓库结构

如果你打算把这套 SKILL 接入自己的 Obsidian 笔记库，不要直接复制一堆目录，也不要覆盖已有笔记。

请让你的 AI 优先安装并使用：

```text
skills/general/educational-llm-wiki/
```

然后让 AI 判断：

- 如果是空的 Obsidian 仓库：使用 Skill 内置模板建立推荐三层结构，并放置 `AGENTS.md`。
- 如果是已经有笔记的仓库：保留现有结构，先整理目录用途，再追加 K12 Skill 路由和写入映射。

可以直接把这段话发给 AI：

```text
请安装并使用 skills/general/educational-llm-wiki/，帮我判断当前 Obsidian 笔记库是空仓库还是已有结构仓库。如果没有结构，请用它的 assets/vault-template 建立 100-Raw / 200-Wiki / 300-Output 三层结构，并创建 AGENTS.md；如果已有结构，请不要覆盖或搬空旧笔记，先整理现有目录用途，再给出 K12 Skill 的写入映射。请检查目标仓库是否已有 AGENTS.md：如果没有，请新建；如果已经有了，请只追加必要规则。
```

完整安装顺序见 [安装指南](docs/installation-guide.md)。

### 4. 可选：跑夜间错题产线

如果你要把本仓库当作“睡前交错题、早上出诊断和变式题”的本地系统使用：

```bash
cp engine/config.sample.json engine/config.json
cp -r students/_template students/stu-001
node engine/night-run.mjs --student stu-001
node engine/build-dashboard.mjs
```

配置、真实学生数据、日志和生成的 `dashboard.html` 都已加入 `.gitignore`。完整说明见 [K12 错题分析产线运行手册](docs/k12-nightline-handover.md)。

---

## 🧬 学习系统核心飞轮

在这个生态中，SKILL 不是孤立的；当任务需要且用户授权时，摘要数据会在底层产生有限协同。

```text
                    ┌──────────────────┐
                    │  🧬 学习DNA      │
                    │  长期档案底座     │
                    └────────┬─────────┘
                             │ 提供已授权摘要
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │  ❌ 智能错题本 │  │ ⏰ IM智能提醒 │  │ 🎓 费曼学习法 │
  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
                    ┌──────────────────┐
                    │ 📊 每周学习复盘   │
                    │  周级汇总与追问    │
                    └──────────────────┘
```

SKILL联动协调器会在明确任务下，把错题、费曼、笔记、理科题目掌握、学习计划、时间专注汇总为月报或系统健康检查。它负责局部联动和报告汇总，不替代各学科 SKILL 的专业判断。

---

## 🧠 主要能力

### 通用学习系统

| 工具                                                     | 关键能力                       |
| ------------------------------------------------------ | -------------------------- |
| [学习DNA](skills/general/learning-dna/)                 | 长期档案、成长图谱、学习风格偏好、兴趣与跨科接口   |
| [智能错题本](skills/general/correction-notebook/)          | 四维错因分析、弱项预警、同类题验证、学期错题报告   |
| [IM智能提醒](skills/general/im-reminder/)                 | 复习提醒、计划提醒、探索提醒、每日确认回访      |
| [费曼学习法](skills/general/feynman-learning/)             | 五跳追问、理解验证、挑战者模式、深度档案       |
| [每周学习复盘](skills/general/weekly-review/)               | 六模块周报、学习存折、学习区检查、成长曲线、复盘追问 |
| [教育LLM知识库](skills/general/educational-llm-wiki/)       | 三层学习 vault、资料编译、Obsidian skills 安装、索引日志 |
| [教育版SKILL创建教练](skills/general/educational-skill-creator/) | 用教育理论约束新 SKILL 的目标、流程、反馈和安全边界 |
| [康奈尔笔记](skills/general/cornell-notes/)                | 拍照提炼、线索区、自测问题、跨科网络         |
| [SKILL联动协调器](skills/general/skill-coordinator/)      | 联动判断、学习区校准、全景月报、系统健康检查     |
| [理科解题四步法](skills/general/science-solving-four-steps/) | 教练式提示阶梯、题型判断、波利亚四步解题、变式迁移 |
| [30天学习计划制定师](skills/general/learning-plan/)          | 目标拆解、节奏安排、学习区校准、阶段检查       |
| [时间与专注力教练](skills/general/time-focus-coach/)         | 反多任务、时间块、番茄节奏、专注复盘         |
| [跨学科侦探周](skills/general/cross-subject-detective/)      | 跨学科连接、项目式探索、证据化输出          |
| [兴趣成长探索计划](skills/general/interest-explorer/)         | 兴趣线索收集、成长任务设计、长期动机维护       |
| [阶段学习体检](skills/general/learning-360-review/)          | 证据化阶段复盘、A/B/C 判断、系统修复动作      |

### 学科专项

| 学科  | 代表工具                                               | 关键特色                |
| --- | -------------------------------------------------- | ------------------- |
| 语文  | [语文写作教练](skills/chinese/chinese-writing-coach/)   | 5步流程、风格DNA、苏格拉底追问   |
| 数学  | [数学解题教练](skills/math/math-problem-solving-coach/) | 四步拍照法、CLAW5 模板、思路追问 |
| 英语  | [英语口语陪练](skills/english/english-speaking-coach/)  | 晨间热身、角色扮演、口语成长轨迹    |
| 物理  | [物理解题教练](skills/physics/physics-problem-coach/)   | 图景建立、四步解题、物理三层追问    |
| 历史  | [历史时空观教练](skills/history/history-timeline-coach/) | 先定位时空、因果解释、史料实证      |
| 地理  | [地理读图定位教练](skills/geography/geography-map-coach/) | 无图不题先读图、区域综合、过程机制   |
| 政治  | [政治知识体系教练](skills/politics/politics-framework-coach/) | 先定位理论模块、概念辨析、价值论证 |
| 化学  | [化学微粒观建模教练](skills/chemistry/chemistry-particle-modeler/) | 宏观现象、微观粒子、符号表达贯通 |
| 生物  | [生物结构与功能教练](skills/biology/biology-structure-function-coach/) | 结构层级、功能过程、调节关系贯通 |

完整 60 个 SKILL 清单见 [系统架构与方法论](docs/architecture.md)。

---

## 📚 文档导航

- [🚀 快速上手与使用指南](docs/getting-started.md)
  - 三路径决策树：只用 Skill / 接入 Obsidian / 跑夜间产线
  - Claude Code（`.claude/skills/`）与 Codex CLI（`.agents/skills/`）正确安装
- [系统架构与方法论](docs/architecture.md)
  - K12 学习场景 60 个 SKILL 全清单
  - 协作飞轮与方法论依据
  - 目录结构与学科分层
- [学习科学原则接入规范](docs/learning-science-principles.md)
  - 12 个认知原理如何转成 SKILL 设计约束
  - 主动回忆、错误反馈、交错练习、分散复习等最低要求
- [理论资料索引](references/理论资料索引.md)
  - 仓库级理论文件入口
  - 学习区、85/15 意外挑战、记忆复习、理解追问、错因、专注、跨学科等一理论一笔记入口
- [安装指南与发布信息](docs/installation-guide.md)
  - 分阶段安装顺序
  - 包级上架建议
  - 单个 SKILL 打包校验
  - 轻度/中度/重度用户组合
- [K12 错题分析产线运行手册](docs/k12-nightline-handover.md)
  - 夜间产线、看板、控制台和学生档案目录
  - 运行边界、隐私边界和质量门
- [K12 夜间错题分析使用文档](docs/k12-nightline-guide.md)
  - 给学生、家长和运营者的交错题使用说明
- [Obsidian 学习仓库架构](docs/obsidian-vault-architecture.md)
  - `100-Raw / 200-Wiki / 300-Output` 三层笔记分层
  - `AGENTS.md` 项目级调用规则
- [AI 用 Obsidian 仓库接入手册](docs/AI-obsidian-integration-manual.md)
  - 空仓库：建立推荐结构并放置 AGENTS 模板
  - 已有仓库：整理现有结构，追加 K12 Skill 路由
- [AGENTS.md 模板](docs/AGENTS.k12-learning-vault.template.md)
  - 可复制到 Obsidian vault 根目录作为本地宪法
- [版本历史与升级追踪](docs/changelog.md)
  - 各 SKILL 当前版本
  - v1.0 → v2.0 的整合升级记录
- [Release Notes](RELEASE_NOTES.md)
  - v1.0 授权原版说明
  - v2.0 当前版本新增内容

---

## 🛡️ 安全与隐私

本仓库遵循统一的最小化记录原则，详见 [SECURITY_BASELINE.md](SECURITY_BASELINE.md)：

- 未经明确同意，不建立长期档案
- 未经明确同意，不发送提醒，不跨 SKILL 共享
- 只读取完成当前任务所需的最小字段摘要
- 用户始终拥有查看、更正、删除、暂停、取消共享的控制权

---

> “从第一次记录错题，到某一天你能主动说出‘我这类题总在这里卡住’——这中间的距离，就是学习系统真正跑起来的证据。”
