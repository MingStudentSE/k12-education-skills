# 版本历史与维护追踪

> 当前版本为 **V3.0**：4 个 Product Module、61 个内部 playbook、58 个学习能力、63 条旧入口映射、229 条四模块自然语言行为 fixture；其中 80 条同时属于 Learning 路由白盒子集，6 条同时属于课标证据子集，行为通过以单独的 live report 为证。

## 2026-07-12 · 2022 新课标核心素养证据模型

- 在 `k12-learning` 内新增义务教育 2022 课标事实层与九个当前学科的项目操作化 evidence profile，不新增 capability、playbook 或 Product Module。
- 固定“核心素养 → 可观测证据 → 学习任务 → 反馈调整”执行链；首次使用仍受 3–5 分钟与最多 3 个短动作约束。
- 明确高中不得套用 2022 义务教育模型，初中“道德与法治”与高中“思想政治”不再混为同一课标事实。
- 新增 Schema、引用完整性和可执行回归门；清理被 all-in-one 主文件替代的孤儿资源与旧 handover 协议。
- 新增四模块两阶段黑盒行为 runner：generator 不读取期望，evaluator 在独立上下文中对冻结回答引用原文判定；内部路由降为次级白盒回归。
- 恢复 `llm-wiki` 的自包含长实现，移除与主文件重复的六份 reference，并删除以 LOC 判断 module 深度的门禁。
- 新增无副作用 curriculum resolver；九科官方事实升级为 `dataVersion 1.2.0`，学科级去重保存教育部 PDF/章节/起始页/SHA-256，每项 competency 保存精确 `sourcePage`，resolver 才组合最终引用；在线复核会 OCR 指定页并核对正式名称。
- Automation steady-state 不再读取 Learning `profile.md`；state/request/output Schema 进入真实 runtime，Mock 与真实模型共用同一 adapter seam，旧授权只走一次性迁移 CLI。
- semantic gate 从 58 个 `playbook.md` 扩到所有运行可达 Markdown；V2、genesis 与旧仓库审计移入 `docs/history/`。

## 2026-07-12 · V3 内部深化与用户向导

- 根据首次使用反馈，将 onboarding 改为“拿一份手头材料 → 3–5 分钟快速测评 → 会话内初版学习 DNA → 立即完成一个真实动作”；删除七字段完整道和“有题就跳过画像”的旧默认。
- 新增首次使用可执行契约门，固定材料优先、测评上限、初版 DNA、立即行动与跨会话保存授权，并加入首次带材料、拒绝全面测评等回归用例。
- 把 llm-wiki 从零散写入示例补成用户可执行的“新建/接入 → 入库 → 学习结果沉淀 → 查询与体检”路径，并加入首次 Wiki 引导和学习结果写入回归用例。
- 重写 README 的用户首页叙事，先解释目标用户、学习闭环、首次体验、Wiki、自动化与隐私边界，再展示四模块和维护信息。
- 用内部 `system-guide` 替换冗余的 `skill-coordinator`；多方法组合改由 `k12-learning` 主流程直接负责，公开 Product Module 仍为 4 个。
- 新增 canonical 用户指南，覆盖第一次使用、日常学习、九学科、Wiki、提醒、OCR、夜间分析与授权话术。
- 清理学习 playbook 主文件中的 `depends_on`、旧公开 Skill 和跨 Skill 交接语义；真实提醒统一通过 `k12-automation` seam。
- 夜间产线改为读取 Learning 拥有的版本化 adapter，不再遍历内部 playbook 目录；Automation 授权/运行状态与 Learning State 分离。
- 新增 V3 路由契约与 live Codex 回归入口，组合用例扩为 5 条，并让 route fixture 可形成完整 decision Schema。
- 迁移映射补记可审计来源：Git 快照为 62 个旧 Skill，`k12-learning-router` 作为仅有审计记录、无 Git object 的例外单列。
> 本文档面向维护者；v2.x 的 63-Skill 表格从下方“历史版本状态”起保留作追溯，不代表当前安装结构。公开发布说明见 [Release Notes](../RELEASE_NOTES.md)。

---

## V3.0 四模块重构（2026-07-11）

- 用 `k12-learning` 取代总路由 + 45 个学科入口 + 大部分通用入口；能力转为内部 playbook。
- 用用户新写的 `llm-wiki` 替换旧 `educational-llm-wiki`，统一为四层结构。
- 把提醒、夜跑、OCR、看板和授权运行时收进 `k12-automation`。
- 把教育 playbook 创建与 S1–S8 质量评分收进维护者专用 `k12-skill-studio`。
- 建立 `CONTEXT.md`、ADR-0001、Capability Map、旧入口映射和四模块质量门。
- 删除旧 category 下的公开 `SKILL.md`，不保留会重新被平台发现的兼容壳。

## 历史版本状态总览（v2.3）

### 通用学习系统（18 个）

| # | SKILL | 当前版本 | 维护状态 |
|---|-------|---------|----------|
| 1 | 学习DNA | v1.2.0 | 已完成成长图谱、学习风格、兴趣接口整合 |
| 2 | 智能错题本 | v1.3.0 | 已完成弱项预警、同类验证、学期报告整合，并接入错误反馈闭环 |
| 3 | IM智能提醒 | v1.1+ | 已扩展复习、计划、探索和每日确认提醒 |
| 4 | 费曼学习法 | v1.1.1 | 已完成挑战者模式、第五跳、理解深度档案，并接入主动回忆与故事化地标 |
| 5 | 每周学习复盘 | v1.1.3 | 已升级为六模块周报，并接入学习区与学习科学命中检查 |
| 6 | 教育LLM知识库 | v1.0.0 | 新增，负责教育版 LLM Wiki 三层结构、资料编译、索引日志和健康检查 |
| 7 | 教育版SKILL创建教练 | v1.1.0 | 已改名避免与本机通用 skill-creator 混淆，并加入学习科学创建检查 |
| 8 | 康奈尔笔记 | v1.0.1 | 已接入固定版式、线索回忆和分散复测字段 |
| 9 | SKILL联动协调器 | v1.1.4 | 只负责多 Skill 编排、学习区校准和多维月报，不承担全局分流 |
| 10 | 30天学习计划制定师 | v1.0.3 | 已接入学习区、85%规则、分散练习和交错练习 |
| 11 | 时间与专注力教练 | v1.0.2 | 已接入反多任务、情境记录和切换成本字段 |
| 12 | 跨学科侦探周 | v1.0 | 稳定 |
| 13 | 兴趣成长探索计划 | v1.0 | 稳定 |
| 14 | 理科解题四步法 | v1.1 | 已增强教练式提示阶梯、题型判断和阶段路由 |
| 15 | 阶段学习体检 | v1.0 | 新增，可选高级阶段复盘与证据化 360 体检 |
| 16 | 学生快速评测 | v1.1.0 | 无明确任务时输出会话内画像、路由提示和授权后的 DNA 种子 |
| 17 | 技能体系质量打分校验器 | v1.4.1 | 提供 8 维行为 rubric、双盲评测协议、8 个场景和回归 scorecard |
| 18 | K12 学习总路由 | v1.0.0 | 无副作用自然语言入口，注册 62 个目标并静默直达 |

### 学科专项（45 个）

| 学科 | 数量 | 当前版本 | 维护状态 |
|------|------|----------|----------|
| 语文 | 5 | v1.0 | 稳定 |
| 数学 | 5 | v1.0 | 稳定 |
| 英语 | 5 | v1.0 | 稳定 |
| 物理 | 5 | v1.0 | 稳定 |
| 历史 | 5 | v1.0 | v1.5 新增，稳定 |
| 地理 | 5 | v1.0 | v1.5 新增，稳定 |
| 政治 | 5 | v1.0 | v1.5 新增，稳定 |
| 化学 | 5 | v1.0 | v1.6 新增，稳定 |
| 生物 | 5 | v1.0 | v1.6 新增，稳定 |

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
| 学生快速评测 | 新增 v1.0.0 | 在 `learning-dna` 前做七字段 intake，未授权只保留会话内画像 |
| 技能体系质量打分校验器 | 新增 v1.0.0 | 评整套系统端到端行为质量，与 darwin-skill 单 SKILL 结构评分互补 |
| K12 学习总路由 | 新增 v1.0.0 | 从用户手动点名改为自然语言分流；路由不读档，协调器只编排 |

---

## Skill 质量优化记录

### 2026-07-11 v2.3 全局路由与授权门修复

- 新增 `skills/general/k12-learning-router/`，总数调整为 63、通用层调整为 18。
- 内置 62 目标机读注册表、路由冲突规则、严格 `route-decision` Schema 和自然语言回归用例。
- `student-quick-assessment` 收敛为 intake 分支；`skill-coordinator` 保持多 Skill 编排职责。
- `system-quality-scoring` 升级为 v1.4.1，scorecard 场景数约束与 S1-S8 契约对齐。
- 补齐 23 个本地 reference 的 frontmatter 声明，避免独立安装后资源不可发现。
- `pipeline/review.sh` 新增 63/18 范围、62 目标覆盖、canonical Skill 名、Schema/授权契约与运行层冒烟门禁。
- 修复网页和夜跑自动声称监护人授权：本地建档、真实模型处理、OCR 分域授权；撤权后首页、文件接口和 dashboard 不再读取或展示学生数据。

维护原则：路由只读当前请求和已安装 Skill 元数据；读取历史、写档、提醒和跨 Skill 数据传递仍需目标 Skill 明确授权。

### 2026-06-20 v2.1 前置画像与系统质量基准

本轮新增两个系统级 SKILL，把现有体系从“有运行层和质量门”推进到“有前置入口和可回归行为基准”：

- 新增 `skills/general/student-quick-assessment/`：七字段 intake、快/全双通道、证据库存、授权门和 `intake-persona.schema.json`。
- 新增 `skills/general/system-quality-scoring/`：8 维 rubric、5 个标准场景、双盲协议、裁判提示词和 `scorecard.schema.json`。
- README、architecture、Release Notes、AGENTS 计数同步为全仓 62 个 Skill、通用层 17 个 Skill。

维护原则：

- 不改动既有 60 个 SKILL 内容。
- 新增 SKILL 不依赖仓库根 `references/`，运行时参考资料均放在自身目录。
- 未授权不建长期档案；盲测裁判不得见引擎身份；D6/D7 红线违规执行总分封顶。

### 2026-06-15 v2.0 工程化体系优化

本轮完成工程化体系优化，不降低当前 60 个 Skill 范围：

- 同步并瘦身通用、语文、数学、英语、物理 34 个 Skill。
- 将新增的 `educational-llm-wiki`、历史、地理、政治 16 个长 Skill 做搬家型瘦身：主文件保留触发边界、核心流程、红线和 references 索引，完整原文移入本 Skill 自己的 `references/full-spec.md`。
- 新增 `engine/night-run.mjs`，支持按学生 inbox 批处理错题，产出错因诊断、错题档案、变式训练题、答案讲解和晨报。
- 新增 `engine/build-dashboard.mjs` 和 `engine/server.mjs`，分别提供静态看板和仅绑定 `127.0.0.1` 的交互式控制台。
- 新增 `students/_template/`，只保留模板；真实学生数据、日志、配置和 dashboard 产物已加入 `.gitignore`。
- 新增 `pipeline/` 质量门资料，并把 `pipeline/review.sh` 改成当前仓库相对路径；无旧基线时运行基础门，有 `backup-pre-fix/` 或 `K12_BASELINE` 时再做关键词覆盖。
- 夜间产线技能映射已扩展到语文、数学、英语、物理、历史、地理、政治、化学、生物和综合。

维护原则：

- 60 个 Skill 均须保持单目录可安装，不依赖仓库根 `references/` 或其他 Skill 目录。
- V2 当时曾用主文件行数约束推动内容搬家；V3 已废止该规则，不再用文件长度判断 module depth。
- 运行层 `engine/` 可读全仓 `skills/`，但不得写入 Skill 内容或自进化。

### 2026-06-15 v1.6 化学与生物学科专项

本轮新增两门科学学科专项，把现有理科支持从物理扩展到化学与生物：

- 新增 `skills/chemistry/` 5 个 Skill：`chemistry-particle-modeler`、`chemistry-concept-explainer`、`chemistry-reaction-coach`、`chemistry-lab-inquiry`、`chemistry-error-dna`。
- 新增 `skills/biology/` 5 个 Skill：`biology-structure-function-coach`、`biology-concept-map-builder`、`biology-process-explainer`、`biology-experiment-inquiry`、`biology-error-dna`。
- 化学专项统一第一步铁律：“宏观现象 → 微观粒子 → 符号表达”；生物专项统一第一步铁律：“结构层级 → 功能过程 → 调节关系”。
- 每个新增 Skill 均包含 `SKILL.md`、本地 `references/` 和 `test-prompts.json`，保持独立安装边界。

维护原则：

- 化学错因由 Ch1-Ch5 归因，不重复通用错题本记录。
- 生物错因由 B1-B5 归因，不重复通用错题本记录。
- 新增学科不依赖根目录 `references/` 作为运行时材料。

### 2026-06-14 v1.4 教育 LLM Wiki Skill

本轮把 Obsidian/Markdown 学习仓库接入从“文档告诉 AI 怎么做”升级为“由专门 Skill 负责搭建、适配和维护”：

- 新增 `skills/general/educational-llm-wiki/`，当时仓库从 34 项 Skill 扩展到 35 项，其中 `skills/general/` 从 14 个扩展为 15 个。
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
| 学生端总数 | 63 个 SKILL |
| 通用学习系统 | 18 个 SKILL |
| 学科专项 | 45 个 SKILL |
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
