# 🎓 K12 教育 AI 辅导系统

> 适用平台：OpenClaw / ClawHub / SkillHub
> 当前仓库聚焦 **K12 学习场景 33 个 SKILL**，覆盖通用学习系统与语数英物四大学科专项。

传统的 AI 往往被当成“给答案的计算器”。
这套 K12 教育 AI 辅导系统希望把 AI 变成“追问思路、陪你复盘、帮你形成长期学习系统的教练”。

---

## 📦 包含模块

当前仓库按学生使用场景分为两大层：

### 通用与成长层（`skills/general/`）· 13 个 SKILL

- **核心五件套**：学习DNA、智能错题本、IM智能提醒、费曼学习法、每周学习复盘
- **学习方法论包**：SKILL创建教练、康奈尔笔记、五SKILL联动协调器、理科解题四步法
- **自我管理与探索包**：30天学习计划制定师、时间与专注力教练、跨学科侦探周、兴趣成长探索计划
- **学习区原则**：用约85%熟悉内容 + 15%意外挑战校准任务难度，配合间隔、多场景、测验和知识连接

### 学科专项层（`skills/{subject}/`）· 20 个 SKILL

- **语文**（5 个）：写作、阅读、文言文、素材积累、语病纠偏
- **数学**（5 个）：解题、错误DNA、概念解释、应用题建模、思维梯度训练
- **英语**（5 个）：口语、词汇DNA、语法、听力、写作
- **物理**（5 个）：解题、错误DNA、概念直觉、物理建模、实验思维

---

## 📊 状态总览

| 类别     | 数量     | 状态               |
| ------ | ------ | ---------------- |
| 通用与成长层 | 13     | ✅ v1.2 可用 |
| 学科专项层  | 20     | ✅ v1.2 可用 |
| **总计** | **33** | **100% 可用**      |

### 安装包边界

每个 SKILL 都按“单个目录可独立安装”的方式维护。  
如果某个 SKILL 需要参考材料、schema 或模板，这些文件必须放在该 SKILL 自己的 `references/` 或 `schemas/` 目录下，不能依赖仓库根目录的共享文件。

---

## 🚀 快速开始

> ⚠️ 建议先安装核心 SKILL，再按实际学科痛点加装专项 SKILL；不要一开始把 33 个全装上。

### 1. 让 Agent 安装核心 SKILL

把下面这段话发给你的 Claude Code / Codex / Work Buddy 等 Agent：

```text
请从这个仓库获取 Skill：
https://github.com/MingStudentSE/k12-education-skills

只安装核心学习闭环需要的 SKILL：

1. skills/general/learning-dna/
2. skills/general/correction-notebook/
3. skills/general/feynman-learning/
4. skills/general/weekly-review/

每个 SKILL 都以单个目录为安装单位。请保留每个目录内的 SKILL.md、references/、schemas/ 等配套文件。不要安装全部 33 个 SKILL；后续等我明确需要某个学科专项时再加装。

请把这些 Skill 安装到当前项目的项目级 Skill 位置，例如 .codex/skills/、.claude/skills/ 或你支持的项目级 Skill 管理器中。安装方式以你的平台为准，但不要拆散 Skill 目录。
```

### 2. 核心 SKILL 顺序

1. [🧬 学习DNA](skills/general/learning-dna/)：建立长期学习档案的授权底座
2. [❌ 智能错题本](skills/general/correction-notebook/)：从“保存题目”升级为“定位错因”
3. [🎓 费曼学习法](skills/general/feynman-learning/)：验证到底是真懂还是假懂
4. [📊 每周学习复盘](skills/general/weekly-review/)：把过程沉淀成周报和成长线索
5. 按需加装 [⏰ IM智能提醒](skills/general/im-reminder/) 或具体学科专项

### 先让 AI 判断仓库结构

如果你打算把这套 SKILL 接入自己的 Obsidian 笔记库，不要直接复制一堆目录，也不要覆盖已有笔记。

请让你的 AI 先阅读：

```text
docs/AI-obsidian-integration-manual.md
```

然后让 AI 按手册判断：

- 如果是空的 Obsidian 仓库：建立推荐三层结构，并放置 `AGENTS.md`。
- 如果是已经有笔记的仓库：保留现有结构，先整理目录用途，再追加 K12 Skill 路由。

可以直接把这段话发给 AI：

```text
请先阅读 docs/AI-obsidian-integration-manual.md，然后帮我判断当前 Obsidian 笔记库是空仓库还是已有结构仓库。如果没有结构，请帮我建立推荐三层结构，并创建 AGENTS.md；如果已有结构，请帮我整理现有目录，并给出 K12 Skill 的写入映射。请检查目标仓库是否已有 AGENTS.md：如果没有，请新建；如果已经有了，请不要覆盖，只帮我追加这套 Skill 的调用逻辑。
```

完整安装顺序见 [安装指南](docs/installation-guide.md)。

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

五SKILL联动协调器会在明确任务下，把错题、费曼、笔记、理科题目掌握、学习计划、时间专注汇总为月报或系统健康检查。

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
| [康奈尔笔记](skills/general/cornell-notes/)                | 拍照提炼、线索区、自测问题、跨科网络         |
| [五SKILL联动协调器](skills/general/skill-coordinator/)      | 联动判断、学习区校准、全景月报、系统健康检查     |
| [理科解题四步法](skills/general/science-solving-four-steps/) | 波利亚四步解题、题目结构拆解、变式迁移、间隔复测   |

### 学科专项

| 学科  | 代表工具                                               | 关键特色                |
| --- | -------------------------------------------------- | ------------------- |
| 语文  | [语文写作教练](skills/chinese/chinese-writing-coach/)   | 5步流程、风格DNA、苏格拉底追问   |
| 数学  | [数学解题教练](skills/math/math-problem-solving-coach/) | 四步拍照法、CLAW5 模板、思路追问 |
| 英语  | [英语口语陪练](skills/english/english-speaking-coach/)  | 晨间热身、角色扮演、口语成长轨迹    |
| 物理  | [物理解题教练](skills/physics/physics-problem-coach/)   | 图景建立、四步解题、物理三层追问    |

完整 33 个 SKILL 清单见 [系统架构与方法论](docs/architecture.md)。

---

## 📚 文档导航

- [系统架构与方法论](docs/architecture.md)
  - 学生端 33 个 SKILL 全清单
  - 协作飞轮与方法论依据
  - 目录结构与学科分层
- [安装指南与发布信息](docs/installation-guide.md)
  - 分阶段安装顺序
  - 包级上架建议
  - 单个 SKILL 打包校验
  - 轻度/中度/重度用户组合
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
  - v1.0 → v1.2 的整合升级记录
- [Release Notes](RELEASE_NOTES.md)
  - v1.0 授权原版说明
  - v1.2 当前版本新增内容

---

## 🛡️ 安全与隐私

本仓库遵循统一的最小化记录原则，详见 [SECURITY_BASELINE.md](SECURITY_BASELINE.md)：

- 未经明确同意，不建立长期档案
- 未经明确同意，不发送提醒，不跨 SKILL 共享
- 只读取完成当前任务所需的最小字段摘要
- 用户始终拥有查看、更正、删除、暂停、取消共享的控制权

---

> “从第一次记录错题，到某一天你能主动说出‘我这类题总在这里卡住’——这中间的距离，就是学习系统真正跑起来的证据。”
