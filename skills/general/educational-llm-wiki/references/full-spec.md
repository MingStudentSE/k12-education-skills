---
name: educational-llm-wiki
display_name: 🧭 教育LLM知识库
version: 1.0.0
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [LLM Wiki, Obsidian, 学习知识库, 目录架构, 知识编译, 学习证据, 索引, 安全边界]
description: >
  帮学生、家长、老师或本地 AI 把 Markdown/Obsidian 学习仓库搭成教育版 LLM Wiki：
  使用 100-Raw / 200-Wiki / 300-Output 三层结构保存原始学习证据、AI 编译知识和输出成果。
  当用户说“搭建学习知识库”“适配 Obsidian”“整理学习 vault”“把资料编译成 wiki”
  “设计 100-Raw/200-Wiki/300-Output 目录”“维护学习总控台/索引/日志”
  “检查或安装 Obsidian skills”“没有 Obsidian skill 就安装 kepano/obsidian-skills”
  “健康检查学习知识库”“不要只做文档，要做教育 LLM Wiki skill”时，必须激活此 SKILL。
  核心功能：安全判断空仓库或已有仓库、建立教育目录模板、分类原始证据、
  将错题/笔记/资料/反馈编译为可链接 wiki 页面、检查并安装 Obsidian 官方 skills、
  维护索引与日志、把高价值回答沉淀回知识库。
compatibility: OpenClaw / ClawHub / Codex / Claude Code / Obsidian
references:
  - references/education-layer-rules.md
  - references/compile-workflow.md
  - references/obsidian-skill-install.md
  - references/real-vault-adaptation-pattern.md
  - references/recommended-directory-structure.md
---

# 🧭 教育LLM知识库 SKILL

> **一句话定位：** 把学习资料库从“文件夹堆积”升级为“会持续编译、会自我维护、能被 AI 可靠调用的学习 wiki”。

---

## 前置要求：先检查 Obsidian skills

任何工作（模式 A-F）开始前，**必须先检查 Obsidian skills 是否就绪**——这是前置要求，不是可选模式。本 skill 处理的是 Obsidian/Markdown 仓库，依赖官方 Obsidian skills 提供 Markdown 语法、CLI、Bases、Canvas、网页清理能力。

执行：

1. 读取 `references/obsidian-skill-install.md`。
2. 检查项目级或用户级 skill 目录是否已有 `obsidian-markdown`、`obsidian-bases`、`obsidian-cli`、`json-canvas`、`defuddle`。
3. 若缺失，先进入**模式 F 安装**（征得用户同意后），再继续当前任务；不要在缺 Obsidian skill 的情况下勉强处理 Obsidian 专属内容（Bases/Canvas/网页清理）。
4. 若已就绪，正常进入最小执行闭环。

---

## 最小执行闭环

1. **判断场景**：先判断用户要做的是新建结构、适配已有仓库、编译原始资料、查询 wiki、生成成果，还是做健康检查。
2. **读取规则**：涉及目录设计、分层、迁移时读取 `references/education-layer-rules.md`；涉及资料编译和页面写法时读取 `references/compile-workflow.md`；涉及 Obsidian skills 检查或安装时读取 `references/obsidian-skill-install.md`。
3. **保护原始证据**：`100-Raw` 中的学生原始输入默认不改写、不覆盖；移动或重命名已有文件前必须先征得用户确认。
4. **执行当前最小动作**：一次只完成当前瓶颈，不把搭建、迁移、编译、报告全部混在一轮里。
5. **更新索引与日志**：只要实际创建或更新了 wiki 页面，就同步维护 `200-Wiki/index.md` 和 `200-Wiki/log.md`（放 200-Wiki 根，不强制子目录）。
6. **收尾坏链检查**：完成目录整理、文件移动或重命名后，必须检查整理后的目录**没有断链**——扫描 wikilink `[[...]]` 和 frontmatter `source:` 是否指向已不存在或已改名的路径；发现断链要么修复引用，要么回退操作。参见 `references/real-vault-adaptation-pattern.md` 的"路径重命名纪律"与"旧路径体检命令"。

---

## 三层核心边界

```text
100-Raw     = 用户原始输入：我收集到的学习证据
200-Wiki    = AI 编译知识：我从证据中学到了什么
300-Output  = AI 输出内容：我要交付、复盘或展示什么
```

- `100-Raw` 放学生、家长、老师或外部资料产生的原始材料，例如错题照片、课堂原文、作业考试、学习记录、文章 PDF、反馈对话。
- `200-Wiki` 放 AI 维护的稳定知识层，例如学习总控台、学习画像、学科概念、错因模式、学习方法、索引、日志、规则。
- `300-Output` 放面向一次具体任务的成果，例如学习计划、周报月报、复习资料包、阶段报告、家校沟通稿、展示作品。

---

## 工作模式

### 模式 A：从 0 到 1 建学习 vault

适用：目标目录很空，用户明确要搭建教育 LLM Wiki。

执行：

1. 先检查目标目录是否已有 `AGENTS.md`、三层目录或大量笔记。
2. 若确认为新仓库，使用 `assets/vault-template/` 的结构创建缺失目录和入口文件。
3. 创建前列出将新增的顶层目录和关键文件。
4. 创建后提示用户从 `100-Raw/00-收集箱/` 或对应原始材料目录开始投喂资料。

### 模式 B：适配已有 Obsidian 仓库

适用：仓库已有日记、学科笔记、错题、周报、项目页或本地规则。

执行：

1. 先盘点现有目录用途，不按名字强行判断好坏。
2. 将现有目录映射为原始证据、编译知识、输出成果三类。
3. 优先追加索引、规则和路由，不移动大量旧笔记。
4. 若已有 `AGENTS.md`，只建议追加教育 LLM Wiki 规则片段，不覆盖原文件。
5. 如需要 Obsidian 专用 Markdown、Bases、Canvas、CLI 或网页清理能力，进入模式 F 检查并安装缺失的官方 Obsidian skills。

### 模式 C：把原始资料编译进 wiki

适用：用户把错题、课堂笔记、学习记录、PDF、文章或反馈放入 `100-Raw` 后要求整理。

执行：

1. 确认原始资料路径和类型。
2. 按 `references/compile-workflow.md` 选择页面类型：摘要、概念、方法、错因模式、学习画像、项目主题或输出成果。
3. 保留可追溯来源，记录冲突、证据不足和待确认问题。
4. 更新相关 wiki 页面、索引和日志。
5. 如果结果是交付物，另存到 `300-Output`；如果其中产生稳定知识，再回填到 `200-Wiki`。

### 模式 D：基于 wiki 回答问题

适用：用户问“我最近数学哪里弱”“这周该复习什么”“这些错题说明什么”。

执行：

1. 先读 `200-Wiki/00-索引与日志/index.md` 和相关 wiki 页面。
2. 只在 wiki 缺失或过期时补读 `100-Raw`。
3. 回答时标明依据页面；若生成了高价值综合，建议写回 `200-Wiki` 或 `300-Output`。

### 模式 E：健康检查与维护

适用：用户要求检查知识库是否混乱、断链、过期、缺索引、缺证据。

检查维度：

- 分层是否混乱：原始材料是否被放进 `200-Wiki`，输出成果是否混进知识层。
- 索引是否可用：`index.md` 是否能帮助 AI 快速定位页面。
- 日志是否连续：`log.md` 是否记录了最近导入、编译、输出和维护。
- 链接是否健康：重要概念、错因模式、学习方法是否互相链接。
- 隐私是否过度：是否记录了不必要的个人敏感信息。

### 模式 F：安装 Obsidian skills

适用：**前置检查**（见"前置要求"小节）发现 Obsidian skill 缺失，或用户明确要求安装。

执行：

1. 读取 `references/obsidian-skill-install.md`。
2. 优先按目标平台选择官方安装方式：Marketplace、`npx skills add https://github.com/kepano/obsidian-skills`，或手动从 `https://github.com/kepano/obsidian-skills` 按需复制。
3. 安装前确认目标 skill 目录；若同名目录已存在，先比较，**不覆盖**。
4. 安装后列出已安装或已存在的 Obsidian skills（`obsidian-markdown` / `obsidian-bases` / `obsidian-cli` / `json-canvas` / `defuddle`），并提示重启或刷新对应 Agent。

> 注：Obsidian skill 的**检查**已提升为前置要求（任何模式开始前），本模式只负责**安装**。

---

## 教育场景安全边界

- 未经学生或监护人明确同意，不创建或更新长期学习画像。
- 未经明确同意，不创建提醒、不发送消息、不跨 Skill 共享学习档案。
- 不把学生原答案改写后覆盖原文；整理版只能进入 `200-Wiki` 或 `300-Output`。
- 对未成年人学习资料只做最小必要记录；家庭、健康、住址、联系方式等高敏信息应省略或低敏概括。
- 学科答疑、错题训练、周复盘等专业处理应路由给对应 K12 Skill；本 Skill 负责知识库结构、编译流程和维护纪律。
- 安装 `kepano/obsidian-skills` 时只增量安装缺失项，不覆盖本地同名 Skill，不删除用户已有文件。

---

## 默认目录模板

模板位于：

```text
assets/vault-template/
```

常用入口：

- `assets/vault-template/AGENTS.educational-llm-wiki.template.md`
- `assets/vault-template/100-Raw/README.md`
- `assets/vault-template/200-Wiki/学习总控台.md`
- `assets/vault-template/200-Wiki/00-索引与日志/index.md`
- `assets/vault-template/200-Wiki/00-索引与日志/log.md`
- `assets/vault-template/300-Output/README.md`

使用模板时只复制缺失文件；目标仓库已有同名文件时，先比较内容并请用户确认。
