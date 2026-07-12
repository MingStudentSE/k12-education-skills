# Release Notes

本文档记录“K12 教育 AI 辅导系统”的公开版本说明。

---

## V3.0 最新版本：63 → 4

本版本把 63 个平级 Skill 重构为 4 个深 Product Module。学习能力没有删除：旧流程、references、schemas、assets 和行为测试先迁移为内部 playbook，验证后再删除旧 interface。

### 新架构

- `k12-learning`：唯一日常学习入口，内部拥有 58 个学习能力，可组合一个主 playbook 与最多两个辅助 playbook。
- `llm-wiki`：以自包含长 `SKILL.md` 提供完整四层 Wiki 实现，采用 `100-Raw / 200-Wiki / 300-Output / 999-Assets`；不按文件长度拆浅。
- `k12-automation`：承接提醒和原夜间运行层，脚本迁入 `scripts/nightline/`，形成独立副作用与授权边界。
- `k12-skill-studio`：承接教育 playbook 创建和系统质量评分，仅供维护者使用。

### 迁移保证

- 63 条旧入口映射保存在 `docs/legacy-skill-mapping.json`。
- 当前基线为 4 个 Product Module、61 个内部 playbook、58 个学习能力，以及 242 条四模块自然语言行为 fixture；其中 80 条同时属于 Learning 路由白盒子集，6 条同时属于课标证据子集，静态契约不冒充 live 行为通过结果。
- 新增 module contract、Capability Map、playbook decision Schema、路径与运行时回归。
- 用户默认只安装 `k12-learning` 与 `llm-wiki`；不再选择侦探、四步法、DNA 等独立 Skill 名。
- 首次使用采用“拿一份手头材料 → 3–5 分钟快速测评 → 会话内初版学习 DNA → 立即完成一个真实动作”；不做全科全面测评，跨会话保存另行确认。
- 新增义务教育 2022 新课标证据层，把核心素养转成可观测证据、最小学习任务和反馈调整；高中版本与道德与法治/思想政治边界分别处理。
- 课标 scope、学科和单一模型统一经过 resolver；官方事实 `dataVersion 1.2.0` 由学科级 PDF/章节/指纹与 competency 级精确 `sourcePage` 组成，在线复核分别验证下载 hash、指定页章节和正式名称。
- Learning 与 Automation 分开拥有状态：提醒授权和运行状态只写 `automation/state.json`，夜间 adapter 的 request/output Schema 在 Mock 与真实路径中都会执行；旧 `profile.md` 授权只能显式一次性迁移。
- 运行可达的 references 已纳入旧语义门禁；V2 与 genesis 指令隔离到 `docs/history/`，不再参与当前 AI 导航。
- 新增可直接使用的四模块 SOP，并同步安装、Obsidian 和夜间产线文档。

---

## V2.3（历史版本）

本版本新增无副作用的自然语言总路由 `k12-learning-router`。仓库 Skill 总数 62 → 63，通用层 17 → 18；62 个既有 Skill 均作为可路由目标，用户不再需要记住或手动点名 Skill。

### 新增内容

- 新增 62 目标机读注册表、冲突优先级、目标不可用降级规则与循环防护。
- 新增 `DIRECT / INTAKE / ORCHESTRATE / CLARIFY / ORDINARY` 五种常规路由模式、`TARGET_UNAVAILABLE` 异常结果和严格路由决策 Schema。
- 新增自然语言、冲突、隐私、非 K12 和未安装目标回归用例。

### 职责与安全调整

- `k12-learning-router` 只读当前请求和已安装 Skill 元数据；不读写档案、不创建提醒、不跨 Skill 共享历史。
- `student-quick-assessment` 只处理首次且无明确任务的 intake；`skill-coordinator` 只处理确需多 Skill 结果传递的编排。
- 修复网页和夜跑自动写“已获监护人授权”的问题：模板默认未授权；本地建档采用主体/日期/方式结构化记录，真实模型处理另记提供方/范围授权，OCR 每次单独确认。
- 质量门新增 63/18 范围、62 目标注册表、canonical Skill 名、6 份 Schema 编译、14 个路由契约正负例，以及授权/撤权/OCR/dashboard 运行层冒烟测试。
- 补齐 23 个本地 reference 声明；评分 scorecard 场景数约束与 S1-S8 对齐。

---

## v2.2

本版本把“错因分析后的飞轮闭环出口”下沉到通用错题本和各科错误 DNA，并把系统评分 rubric 升级到六环闭环与 S1-S8 场景集。历史设计与执行记录现归档于 `docs/history/v2/DESIGN_v2.2_flywheel-loop.md` 和 `docs/history/v2/CODEX_EXEC_v2.2_flywheel-loop.md`，不再作为当前指令。

---

## v2.1

本版本在 v2.0 工程化底座上新增两个系统级 SKILL：前置入口 `student-quick-assessment` 与质量基准 `system-quality-scoring`。仓库 SKILL 总数 60 → 62，通用层 15 → 17。

### 新增内容

- 新增 `skills/general/student-quick-assessment/`：通过七字段 intake 快速定位学生学段、科目、文理/选科方向、证据库存和授权状态；未授权只输出会话内画像，授权后才交付 `learning-dna` 种子。
- 新增 `skills/general/system-quality-scoring/`：提供 8 维行为 rubric、5 个标准测试场景、双盲交叉裁判协议和 `scorecard.schema.json`，用于跨模型横比与系统回归基准。
- 同步 README、架构文档、维护 changelog 与 AGENTS 计数；保持既有 60 个 SKILL 内容不变。

### 工程约束与验证

- 两个新增 SKILL 均采用短 `SKILL.md` + 本地 `references/` / `schemas/` / `test-prompts.json` 的独立安装结构。
- 红线：画像师不默认建长期档案；打分器裁判不得见引擎身份；D6/D7 红线违规总分封顶。

---

## v2.0

本版本把仓库从“内容集合”升级为“可安装、可运行、可验证”的完整教育系统：在保持 60 个 Skill 范围不变的前提下，统一全仓可安装结构、新增本地夜间错题产线运行层、新增质量门与回归考场，并补齐运行手册。这也是把仓库当作独立项目使用的起点版本。

### 新增内容

**运行层 `engine/`（让系统真的跑起来）**

- 新增 `engine/night-run.mjs`：夜间错题产线引擎。按学生 `inbox/` 批处理错题，产出错因诊断、错题档案、变式训练题、答案讲解和晨报四件套；同根因错误累计 ≥3 次触发“顽固弱项专项”，把历史错因定制成变式题。
- 新增 `engine/build-dashboard.mjs`：零依赖静态看板。扫描全部学生生成单文件 `dashboard.html`，🔴 高亮已触发专项的顽固弱项，浏览器或 Obsidian 直接打开。
- 新增 `engine/server.mjs`：仅绑定 `127.0.0.1` 的交互式控制台，浏览器里新建学生、交错题、一键跑分析、在线看产出，并支持拍照 OCR 转写（提交前必须人工核对手写步骤）。
- 新增 `engine/config.sample.json`：配置模板，自填 OpenAI 兼容端点和 API key（**包内不含任何密钥**）。

**质量门 `pipeline/`（让改动可验证、不越改越差）**

- 当时新增的 `CLAUDE_GUIDE_K12_v2.md` 已归档到 `docs/history/v2/`，仅保留版本追溯价值。
- 新增 `pipeline/review.sh`：瘦身质量门，检查主文件行数、悬空引用、JSON 合法性、关键词覆盖与锚点反查。
- 当时的 `EXAM_CLOSED_BOOK.md` 与 `REVIEW_K12_002/003/004.md` 已归档到 `docs/history/v2/`，不属于当前门禁。

**学生运行模板 `students/_template/`**

- 新增空学生档案模板（`profile.md` + `inbox/` 错题样例），复制即可建学生；真实学生数据、配置和日志全部 `.gitignore`，不进版本控制。

**文档**

- 新增 `docs/k12-nightline-handover.md`（产线运行手册）和 `docs/k12-nightline-guide.md`（给学生 / 家长 / 运营者的使用说明）。
- 更新 README、安装指南、changelog，给出 Claude Code / Codex 等平台的项目级安装路径与夜间产线快速开始。

### 结构统一：60 个 Skill 短主文件 + 本地 references

- 全仓 60 个 Skill 统一为“短 `SKILL.md`（主文件 ≤150 行）+ 本地 `references/` 细则”的可独立安装结构。
- 通用层、语文、数学、英语、物理、历史、地理、政治等长 Skill 做搬家型瘦身：主文件只保留触发边界、核心流程、红线和 references 索引，完整原文移入各自 `references/`（`full-spec.md` / `*-full-playbook.md` / `*-operating-manual.md`）。
- 错题本（`correction-notebook`）扩展多智能体协作协议：新增 `schemas/handover-protocol.schema.json`（v2.0 协议）与 `references/handover-protocols.md`、`references/physics-dimension-mapping.md`。
- 化学、生物（v1.6 新增）本身已是短文件，仅同步 frontmatter。

### 工程约束与验证

- 约束：保持现有 60-skill 范围不变；运行时配置、生成的 `dashboard.html`、日志和真实学生数据全部 `.gitignore`，不带入版本控制；运行回路保持确定性脚本，绝不交给模型自进化。
- 已验证：`bash pipeline/review.sh all`、`node --check engine/*.mjs`、`find skills -name SKILL.md | wc -l`（=60）、`git check-ignore` 敏感文件、Codex 盲审与 Claude 证据盲审。
- 未验证：对真实付费模型的夜跑端到端（需使用者自配 API key 后实测）。

---

## v1.6

本版本新增 **化学、生物** 两门学科专项（各 5 个 SKILL，共 10 个），仓库 SKILL 总数 50 → 60，学科专项总数 35 → 45。

### 新增内容

- 新增 `skills/chemistry/` 5 个化学专项 SKILL：微粒观建模、概念理解、反应方程式、实验探究和化学错误DNA。
- 新增 `skills/biology/` 5 个生物专项 SKILL：结构功能、概念图谱、生命过程、实验探究和生物错误DNA。
- 化学专项统一第一步铁律：“宏观现象 → 微观粒子 → 符号表达”，避免先背结论或先套方程。
- 生物专项统一第一步铁律：“结构层级 → 功能过程 → 调节关系”，避免先背零散结论。
- 所有新增 SKILL 均包含本地 `references/` 与 `test-prompts.json`，保持单个目录可独立安装。

---

## v1.5

本版本新增 **政治、历史、地理** 三门文综学科专项（各 5 个 SKILL，共 15 个），补齐 K12 文综版图，仓库 SKILL 总数 35 → 50。

### 新增内容

- 新增 `skills/history/`、`skills/geography/`、`skills/politics/` 各 5 个学科专项 SKILL（共 15 个），按物理五件套五元结构设计（地基 / 概念 / 方法论 / 高阶能力 / 错误DNA）。
- 三学科独有第一步铁律：历史“先定位时空”、地理“无图不题先读图”、政治“先定位理论模块”。高阶能力位重新设计：历史史料实证、地理过程推理、政治价值推理论证。
- 架构层扩展：`handover-protocol.schema.json` 与通用错题本（`correction-notebook`）向后兼容支持政史地（H/G/Po 五维错因 + §9.4/9.5/9.6 协作协议）。
- **价值观合规红线**：政史地价值维度一律用能力描述（“价值论证缺失”），只训练论证构建，绝不评判学生立场；写入每个 SKILL 禁止行为表与 `SECURITY_BASELINE.md`。
- 全程 codex(gpt-5.5/xhigh/fast) 生成 + 教育部课标网络核实（五大核心素养 / 学业质量水平 / 史料与自然机制学段边界均核实）+ darwin-skill 8 维度评分优化（三学科平均 87.7）。

---

## v1.4

本版本新增 `educational-llm-wiki`，把 Obsidian/Markdown 学习仓库接入从“阅读文档后手动适配”升级为“由专门 Skill 搭建、适配、编译和维护”。

### 新增内容

- 新增 `skills/general/educational-llm-wiki/`，当时体系由 34 扩展到 35 项 Skill，其中通用学习系统为 15 个。
- 内置教育版 `100-Raw / 200-Wiki / 300-Output` vault 模板，包含 `AGENTS` 模板、学习总控台、index、log、source map 和各层 README。
- 新增 `references/education-layer-rules.md`、`references/compile-workflow.md` 与 `references/obsidian-skill-install.md`，定义教育资料的分层、编译、索引、日志、健康检查，以及 `kepano/obsidian-skills` 检查安装规则。

### 文档调整

- README、系统架构、安装指南、Obsidian 接入手册和 AGENTS 模板均改为优先使用 `educational-llm-wiki`。
- 普通学科与学习 Skill 仍保持宿主无关；`educational-llm-wiki` 专门负责学习 vault 的结构与维护流程。

---

## v1.3

本版本重点把 K12 教育 SKILL 体系从“功能集合”升级为“有理论底座的学习系统”：建立仓库级学习理论库，按“一个理论一个笔记”记录所有已使用的方法论，并把 12 个认知原理、学习区、85/15 意外挑战、主动回忆、错误反馈、分散练习、交错练习等规则接入核心学习闭环。

### 新增内容

- 新增仓库级 `references/理论资料索引.md` 和 `references/K12教育SKILL理论基础总表.md`，作为全部学习理论入口。
- 新增 20+ 个单理论笔记，包括：
  - `学习区.md`、`85-15意外挑战.md`
  - `主动回忆.md`、`间隔重复.md`、`交错练习.md`
  - `费曼学习法.md`、`康奈尔笔记法.md`、`波利亚四步解题法.md`、`苏格拉底追问.md`
  - `元认知复盘.md`、`支架渐退.md`、`最近发展区.md`、`自我调节学习.md`
  - `错误驱动学习.md`、`错因分类与错因DNA.md`
  - `反多任务.md`、`时间块学习.md`、`番茄工作法.md`、`情境依赖学习.md`
  - `项目式学习.md`、`跨学科连接.md`、`兴趣探索.md`、`概念图谱与新旧连接.md`
- 新增 `references/大脑记忆与表达12个认知原理.md`，把 PDF 中的 12 个认知原理整理为教育 SKILL 的设计约束。
- 新增 `docs/learning-science-principles.md`，用于说明如何把学习科学原则接入新增或改造的 SKILL。

### 能力升级

- `skill-creator` 恢复并改名为 `educational-skill-creator`，避免与本机通用 Codex `skill-creator` 混淆。
- `educational-skill-creator` 升级为 v1.1.0，新增学习科学检查，创建新教育 SKILL 时必须检查主动回忆、错误反馈、分散练习、交错练习、学习区等原则。
- `correction-notebook` 升级为 v1.2.1，接入“错误-修正-再犯预警-变式验证”闭环。
- `feynman-learning` 升级为 v1.1.1，强化主动回忆、故事化地标、迁移验证和适度压力。
- `cornell-notes` 升级为 v1.0.1，强化固定版式、线索回忆和分散复测字段。
- `learning-plan` 升级为 v1.0.3，强化分散练习、交错练习、单时间块单目标和学习区校准。
- `time-focus-coach` 升级为 v1.0.2，强化反多任务、情境记录和切换成本字段。
- `weekly-review` 升级为 v1.1.3，新增学习科学命中检查，周报不只看完成率，也检查主动回忆、错误反馈、交错练习、分散复习和专注证据。

### 文档调整

- README 增加学习科学底座说明和理论资料索引入口。
- 架构文档明确：跨 SKILL 使用的学习理论必须先在根目录 `references/` 登记，再按需复制精简版到单个 SKILL 的 `references/`。
- 维护记录补充 v1.3 理论库与核心闭环接入详情。
- 根目录 `references/` 保持项目级理论库定位，不作为单个 SKILL 的运行时依赖。

---

## v1.2

本版本重点完善 Obsidian 笔记仓库落地方式：让用户可以把仓库链接交给本地 AI，由 AI 判断目标仓库是空仓库还是已有笔记仓库，再选择建立结构或适配现有结构。

### 新增内容

- 新增 `docs/AI-obsidian-integration-manual.md`：专门给本地 AI 阅读的 Obsidian 接入手册。
- 新增 `skills/general/learning-360-review/`：可选高级复盘 Skill，用于阶段学习体检、证据化 360 复盘和系统修复判断。
- 明确两种接入路径：
  - 空仓库：建立中文直白命名的三层结构，并创建 `AGENTS.md`。
  - 已有仓库：保留原有结构，整理现有目录用途，只追加 K12 Skill 调用逻辑。
- README 增加可直接发给 Claude Code / Codex / Work Buddy 等 Agent 的核心 Skill 安装提示词。
- 明确项目级 Skill 安装原则：以单个 Skill 目录为单位安装，保留 `SKILL.md`、`references/`、`schemas/` 等配套文件。

### 文档调整

- 项目公开名称统一为 **K12 教育 AI 辅导系统**。
- 仓库内 Skill 目录从 `student/` 改为 `skills/`，README、架构说明、安装指南和接入手册同步更新。
- `理科解题四步法` 升级为 v1.1.0，补充题型判断、阶段路由、提示阶梯和教练模式。
- `每周学习复盘` 保持轻量，明确不承担阶段评级或 360 体检。
- `docs/AGENTS.k12-learning-vault.template.md` 明确为参考模板，不要求目标仓库原样复制。
- `docs/obsidian-vault-architecture.md` 和 AGENTS 模板改用中文直白目录名，不再使用英文结构名或额外 `999-Assets` 层。
- 明确已有学习证据时才生成学习画像；没有证据时不凭空创建 `学习画像/学习者画像.md`。
- 明确模板路由表只是参考，只有目标项目已安装或用户允许调用的 Skill 才能被使用。

---

## v1.1

本版本在已获授权的原版基础上，进一步收敛为学生端学习系统，并强化“真正掌握”和“学习区”两条主线。

### 新增内容

- 新增 `理科解题四步法`：基于波利亚《怎样解题》的四步框架，把一道理科题拆成“理解题目 → 拟定方案 → 执行方案 → 回顾迁移 → 掌握验证”，帮助学生从“看懂答案”走到“能独立重做、解释思路、迁移变式”。
- 新增波利亚解题法参考材料：随 `science-solving-four-steps` 内置为 `references/polya-four-step-guide.md` 和 `references/science-solving-four-steps-checklist.md`，确保单个 skill 安装时也能携带方法框架。
- 新增学习区原则参考材料：随相关 skill 内置为各自的 `references/learning-zone-principles.md`，覆盖“约 85% 熟悉内容 + 15% 意外挑战”、间隔学习、多场景学习、经常测验、新旧知识连接。
- 学生端总数从 32 个扩展到 33 个，其中 `skills/general/` 从 12 个扩展到 13 个。

### 能力升级

- `30天学习计划制定师` 接入学习区判断，在任务安排中标注熟悉区、学习区、挫败区，并加入 85% 规则的难度校准。
- `每周学习复盘` 增加学习区检查，不只看完成率，也回看本周是否产生了合适的挑战、测验和知识连接。
- `SKILL联动协调器` 升级到 v1.1.3，接入“理科解题四步法”，可以在错题、费曼、康奈尔笔记、学习计划、时间专注之间做更完整的联动判断。
- 核心学习飞轮增加“单题掌握”节点，使错题不只是被记录，而是能被拆解、解释、迁移和复测。

### 范围调整

- 当前仓库已收敛为 K12 学习场景技能库，聚焦学生个人学习系统。
- 教师端内容已从当前发布范围中移除，避免学生端发布包和教师端发布包混淆。
- 文档、安装指南、架构说明和版本追踪均已同步为学生端 33 个 SKILL。

### 文档与安全

- 更新 `README.md`、`docs/architecture.md`、`docs/installation-guide.md`、`docs/changelog.md`，统一当前学生端结构、数量和安装路径。
- 明确单个 SKILL 安装边界：运行时参考材料必须随对应 SKILL 的 `references/` 或 `schemas/` 目录携带，根目录 `references/` 不作为安装依赖。
- 新增 Obsidian 项目级使用文档，采用 `100-Raw / 200-Wiki / 300-Output` 三层架构，并提供可复制的 `AGENTS.md` 模板。
- 更新安全基线示例，继续遵循最小化记录、明确授权、按需联动、用户可撤回的原则。

---

## v1.0 授权原版

第一版来自已获得原作者授权的原版内容。

### 版本定位

- 保留原版的核心学习系统构想和学生端 skill 基础结构。
- 覆盖通用学习系统与语文、数学、英语、物理学科专项。
- 形成“错题记录 → 理解验证 → 知识沉淀 → 提醒复习 → 每周复盘”的基础学习闭环。

### 基础能力

- 通用学习系统：学习DNA、智能错题本、IM智能提醒、费曼学习法、每周学习复盘、康奈尔笔记、SKILL联动协调器等。
- 学科专项能力：语文写作与阅读、数学解题与建模、英语口语与词汇、物理解题与建模等。
- 安全边界：默认不建立长期档案、不跨 skill 共享、不发送提醒，除非用户明确授权。

### 授权说明

v1.0 的内容基于已获得原作者授权的原版整理而来。授权凭证和具体授权范围由项目维护方保存；本仓库的后续版本在该授权原版基础上进行结构化整理、学生端聚焦和方法论增强。
