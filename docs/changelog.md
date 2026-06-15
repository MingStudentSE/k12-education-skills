# 版本历史与维护追踪

> 当前仓库聚焦 **K12 学习场景 35 个 SKILL**。
> 本文档面向维护者，记录内部版本矩阵、模块状态和后续维护方向。公开发布说明见 [Release Notes](../RELEASE_NOTES.md)。

---

## 版本状态总览

### 通用学习系统（15 个）

| # | SKILL | 当前版本 | 维护状态 |
|---|-------|---------|----------|
| 1 | 学习DNA | v1.1+ | 已完成成长图谱、学习风格、兴趣接口整合 |
| 2 | 智能错题本 | v1.2.1 | 已完成弱项预警、同类验证、学期报告整合，并接入错误反馈闭环 |
| 3 | IM智能提醒 | v1.1+ | 已扩展复习、计划、探索和每日确认提醒 |
| 4 | 费曼学习法 | v1.1.1 | 已完成挑战者模式、第五跳、理解深度档案，并接入主动回忆与故事化地标 |
| 5 | 每周学习复盘 | v1.1.3 | 已升级为六模块周报，并接入学习区与学习科学命中检查 |
| 6 | 教育LLM知识库 | v1.0.0 | 新增，负责教育版 LLM Wiki 三层结构、资料编译、索引日志和健康检查 |
| 7 | 教育版SKILL创建教练 | v1.1.0 | 已改名避免与本机通用 skill-creator 混淆，并加入学习科学创建检查 |
| 8 | 康奈尔笔记 | v1.0.1 | 已接入固定版式、线索回忆和分散复测字段 |
| 9 | SKILL联动协调器 | v1.1.3 | 已接入单题掌握、学习区校准和多维月报 |
| 10 | 30天学习计划制定师 | v1.0.3 | 已接入学习区、85%规则、分散练习和交错练习 |
| 11 | 时间与专注力教练 | v1.0.2 | 已接入反多任务、情境记录和切换成本字段 |
| 12 | 跨学科侦探周 | v1.0 | 稳定 |
| 13 | 兴趣成长探索计划 | v1.0 | 稳定 |
| 14 | 理科解题四步法 | v1.1 | 已增强教练式提示阶梯、题型判断和阶段路由 |
| 15 | 阶段学习体检 | v1.0 | 新增，可选高级阶段复盘与证据化 360 体检 |

### 学科专项（20 个）

| 学科 | 数量 | 当前版本 | 维护状态 |
|------|------|----------|----------|
| 语文 | 5 | v1.0 | 稳定 |
| 数学 | 5 | v1.0 | 稳定 |
| 英语 | 5 | v1.0 | 稳定 |
| 物理 | 5 | v1.0 | 稳定 |

---

## 内部升级记录

| 模块 | 版本演进 | 维护备注 |
|------|----------|----------|
| 学习DNA | v1.0 → v1.1+ | 扩展长期档案、成长图谱、兴趣接口和跨科联结 |
| 智能错题本 | v1.0 → v1.1+ | 加入拍题三信息法、四类弱项预警、学期全景报告 |
| 费曼学习法 | v1.0 → v1.1+ | 加入挑战者模式、第五跳和理解深度档案 |
| 每周学习复盘 | v1.0 → v1.1+ | 从感性总结升级为六模块、量化、数据驱动周报 |
| 教育LLM知识库 | 新增 v1.0.0 | 把 Obsidian/Markdown 学习仓库接入从文档升级为可安装 Skill |
| SKILL联动协调器 | v1.0 → v1.1.3 | 从三 SKILL 联动扩展为学习系统协调中枢 |
| IM智能提醒 | v1.0 → v1.1+ | 从复习提醒扩展到计划提醒、探索提醒和每日确认 |
| 30天学习计划制定师 | v1.0 → v1.0+ | 接入学习区定义、85%规则和任务难度校准字段 |
| 理科解题四步法 | 新增 v1.0 → v1.1 | 基于波利亚四步法，承担单题掌握验证；v1.1 增强教练式提示阶梯 |
| 阶段学习体检 | 新增 v1.0 | 从阶段证据判断突破、稳定推进、需要修复或暂不评级 |

---

## Skill 质量优化记录

### 2026-06-14 v1.4 教育 LLM Wiki Skill

本轮把 Obsidian/Markdown 学习仓库接入从“文档告诉 AI 怎么做”升级为“由专门 Skill 负责搭建、适配和维护”：

- 新增 `skills/general/educational-llm-wiki/`，当前仓库从 34 个 Skill 扩展为 35 个 Skill，其中 `skills/general/` 从 14 个扩展为 15 个。
- `educational-llm-wiki` 内置 `references/education-layer-rules.md` 和 `references/compile-workflow.md`，用于三层分区、已有仓库映射、资料编译、索引日志和健康检查。
- 新增 `assets/vault-template/`，提供教育版 `100-Raw / 200-Wiki / 300-Output` 可复制模板、`AGENTS` 模板、学习总控台、index、log 和 source map。
- README、架构说明、安装指南、Obsidian 接入手册和 AGENTS 模板已同步指向 `educational-llm-wiki`，避免用户只依赖静态文档适配。

维护原则：

- 普通学科和学习 Skill 仍保持宿主无关，不写具体 vault 路径。
- `educational-llm-wiki` 是例外：它专门负责目标学习 vault 的结构、写入映射、索引日志和维护纪律。
- 已有 Obsidian 仓库仍不得被完整模板覆盖；先映射现有目录，再最小追加。

### 2026-06-12 v1.3 学习科学理论库与核心闭环接入

本轮把体系从“可用 skill 集合”升级为“有理论底座的学习系统”：

- 将教育场景里的元 skill 恢复为 `skills/general/educational-skill-creator/`。
- frontmatter `name` 改为 `educational-skill-creator`，避免与本机通用 Codex `skill-creator` 混淆。
- 当前仓库保持 34 个 Skill，其中 `skills/general/` 保持 14 个。
- 新增 `references/理论资料索引.md`，作为仓库级理论资料入口。
- 新增 `references/K12教育SKILL理论基础总表.md`，登记当前体系使用的费曼、康奈尔、波利亚、艾宾浩斯、苏格拉底、支架渐退、元认知、项目式学习等理论基础。
- 新增 `references/学习区.md`、`references/85-15意外挑战.md`，记录学习区定义、85%熟悉内容、15%意外挑战和调参动作。
- 新增 `references/大脑记忆与表达12个认知原理.md` 与 `docs/learning-science-principles.md`，把 12 个认知原理转成教育 SKILL 设计约束。
- 新增 `references/主动回忆.md`、`references/间隔重复.md`、`references/交错练习.md`、`references/费曼学习法.md`、`references/康奈尔笔记法.md`、`references/波利亚四步解题法.md`、`references/苏格拉底追问.md`、`references/元认知复盘.md`、`references/支架渐退.md`、`references/最近发展区.md`、`references/自我调节学习.md`、`references/错误驱动学习.md`、`references/错因分类与错因DNA.md`、`references/反多任务.md`、`references/时间块学习.md`、`references/番茄工作法.md`、`references/情境依赖学习.md`、`references/项目式学习.md`、`references/跨学科连接.md`、`references/兴趣探索.md`、`references/概念图谱与新旧连接.md`，把已使用的记忆、理解、复盘、错因、专注和跨学科理论拆成一理论一笔记。
- `educational-skill-creator`、`correction-notebook`、`feynman-learning`、`cornell-notes`、`learning-plan`、`time-focus-coach`、`weekly-review` 已接入第一批学习科学规则。

维护原则：

- 根目录 `references/` 采用“一理论一笔记”，索引只负责组织关系。
- 单个 SKILL 运行时仍不能依赖根目录 `references/`，需要的理论精简版必须随对应 SKILL 打包。

### 2026-06-10 v1.2 教练增强与阶段体检

本轮吸收旧版 Polya 教练经验，同时加入可选高级复盘：

- `science-solving-four-steps` 升级为 v1.1.0，新增教练契约、题型判断、阶段路由表、提示阶梯、教练模式 / 完整解法模式 / 复盘卡模式。
- 新增 `learning-360-review`，中文名“阶段学习体检”，用于阶段学习系统审计和证据化 360 复盘。
- `weekly-review` 保持轻量，只负责普通周报；阶段评级、A/B/C 判断和系统修复交给 `learning-360-review`。
- 当前仓库从 33 个 Skill 扩展为 34 个 Skill，其中 `skills/general/` 从 13 个扩展到 14 个。

### 2026-06-10 v1.2 命名与目录收口

本轮统一仓库公开命名与安装路径：

- 项目名统一为 **K12 教育 AI 辅导系统**，不再使用旧品牌名。
- 代码目录从 `student/` 改为 `skills/`，安装提示、架构文档、接入手册和链接同步改为 `skills/...`。
- Skill frontmatter 作者字段统一为 `K12 教育 AI 辅导系统`。
- Skill 正文中旧助手称呼改为中性的 `AI` 或 `学习助手提示`。
- 本轮只调整命名、路径和展示口径，不改变 33 个 Skill 的核心能力逻辑。

### 2026-06-10 v1.2 Obsidian 落地文档升级

本轮不修改 `skills/` 下的 Skill 本体，只升级仓库级 Obsidian 接入指导。

| 项目 | v1.1 | v1.2 |
|------|------|------|
| Obsidian 接入说明 | 提供通用三层结构和 AGENTS 模板 | 新增 AI 专用接入手册，区分空仓库和已有笔记仓库 |
| 推荐目录 | 带英文目录和额外资产层 | 改为中文直白三层目录，不额外定义 `999-Assets` |
| AGENTS 模板定位 | 易被理解为可直接照抄 | 明确为参考模板，由本地 AI 适配、裁剪或局部追加 |
| Skill 安装说明 | 主要说明目录可独立安装 | README 增加可复制给 Agent 的核心 Skill 安装提示词 |
| 学习画像 | 模板中直接出现英文命名的个人画像文件 | 改为中文命名的 `学习画像/学习者画像.md`，且有授权、有证据时才读取或生成 |

维护原则：

- Skill 本体继续保持宿主无关，不把 Obsidian 目录写入 `skills/` 下的 Skill。
- Obsidian 落地规则只放在 README、架构说明、AGENTS 模板和 AI 接入手册中。
- 面向已有笔记仓库时，不覆盖本地 `AGENTS.md`，不移动大量旧笔记，不创建第二套平行结构。

### 2026-06-10 全量优化

本轮使用 `darwin-skill` 的 8 维 rubric 做 dry-run 评估与结构增强。

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 学生端 SKILL 数量 | 33 | 33 |
| 平均 dry-run 评分 | 72.1 | 85.2 |
| 最低 dry-run 评分 | 58.8 | 80.0 |
| 测试 prompts | 无统一测试集 | 每个 SKILL 新增 `test-prompts.json` |
| references 声明 | 多数未在 frontmatter 显式声明 | 随包 `references/` 已显式声明 |

维护原则：

- SKILL 本体保持宿主无关，不写入 Obsidian 路径、vault 目录或项目级路由规则。
- Obsidian 适配只放在外层 `AGENTS.md` 模板和相关文档中。
- 每个 SKILL 增加“最小执行闭环”和“通用边界与降级策略”，但不改变核心功能。
- 测试 prompts 用于后续回归评估，避免只凭主观感觉判断 skill 是否变好。

---

## 参考材料索引

运行时参考材料必须随单个 SKILL 安装包携带，不能依赖仓库根目录的共享 `references/`。

| 参考材料 | 用途 |
|----------|------|
| `skills/general/educational-llm-wiki/references/education-layer-rules.md` | 教育 LLM Wiki 三层目录、放置规则、frontmatter 和已有仓库映射 |
| `skills/general/educational-llm-wiki/references/compile-workflow.md` | 原始学习资料编译为摘要、概念、错因、方法、输出和索引日志的流程 |
| `skills/general/educational-llm-wiki/references/obsidian-skill-install.md` | 检查并安装 `kepano/obsidian-skills` 官方 Obsidian skills 的流程 |
| `skills/general/learning-plan/references/learning-zone-principles.md` | 学习计划制定时的学习区、85%规则和任务难度校准 |
| `skills/general/weekly-review/references/learning-zone-principles.md` | 周复盘时的学习区命中检查 |
| `skills/general/skill-coordinator/references/learning-zone-principles.md` | 联动协调时的学习区偏离判断与调参动作 |
| `skills/general/science-solving-four-steps/references/learning-zone-principles.md` | 单题变式与复测时的学习区难度控制 |
| `skills/general/science-solving-four-steps/references/polya-four-step-guide.md` | 波利亚四步解题法的 skill 化问题框架 |
| `skills/general/science-solving-four-steps/references/science-solving-four-steps-checklist.md` | 单题真正掌握的等级与验证标准 |
| `skills/general/learning-360-review/references/learning-360-rubric.md` | 阶段学习体检的证据门槛、五维评分和评级映射 |
| `references/理论资料索引.md` | 仓库级理论资料索引，记录所有跨 SKILL 理论入口 |
| `references/K12教育SKILL理论基础总表.md` | K12 教育 SKILL 体系使用的学习理论总表 |
| `references/大脑记忆与表达12个认知原理.md` | 12 个认知原理及教育 SKILL 落地映射 |
| `references/学习区.md` | 学习区定义和任务难度判断 |
| `references/85-15意外挑战.md` | 85% 熟悉内容与 15% 意外挑战 |
| `references/主动回忆.md` | 主动回忆与检索练习 |
| `references/间隔重复.md` | 间隔重复与复习节奏 |
| `references/交错练习.md` | 交错练习与迁移训练 |
| `references/费曼学习法.md` | 费曼学习法 |
| `references/康奈尔笔记法.md` | 康奈尔笔记法 |
| `references/波利亚四步解题法.md` | 波利亚四步解题法 |
| `references/苏格拉底追问.md` | 苏格拉底追问 |
| `references/元认知复盘.md` | 元认知复盘 |
| `references/支架渐退.md` | 支架渐退 |
| `references/最近发展区.md` | 最近发展区 |
| `references/自我调节学习.md` | 自我调节学习 |
| `references/错误驱动学习.md` | 错误驱动学习 |
| `references/错因分类与错因DNA.md` | 错因分类与错因 DNA |
| `references/反多任务.md` | 反多任务 |
| `references/时间块学习.md` | 时间块学习 |
| `references/番茄工作法.md` | 番茄工作法 |
| `references/情境依赖学习.md` | 情境依赖学习 |
| `references/项目式学习.md` | 项目式学习 |
| `references/跨学科连接.md` | 跨学科连接 |
| `references/兴趣探索.md` | 兴趣探索 |
| `references/概念图谱与新旧连接.md` | 概念图谱与新旧连接 |

---

## 当前仓库状态

| 维度 | 状态 |
|------|------|
| 学生端总数 | 35 个 SKILL |
| 通用学习系统 | 15 个 SKILL |
| 学科专项 | 20 个 SKILL |
| 教师端 | 已从当前发布范围移除 |
| Obsidian 项目级使用 | 已新增 `educational-llm-wiki`、AI 接入手册、中文三层结构与参考 AGENTS 模板 |
| 当前定位 | 学生端学习系统技能库 |

---

## 后续维护重点

- 统一各模块版本号表达，必要时升级为明确语义版本。
- 继续检查通用系统与学科专项之间的依赖字段和联动边界。
- 为 `理科解题四步法` 补充更多变式生成、复测节奏和跨学科题型样例。
- 新增参考材料时，必须放进对应 SKILL 的 `references/` 或 `schemas/`，并验证单个 SKILL 可独立安装。
- Obsidian 项目级使用时，优先维护 `AGENTS.md`、`200-Wiki/学习总控台.md` 和三层写入规则。
- 保持 Release Notes 只记录对外发布变化，changelog 只记录内部维护状态。
