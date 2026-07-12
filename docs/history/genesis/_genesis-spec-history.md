> **历史快照（无当前权威）**：本文件只记录 genesis 阶段的学科设计。不要把其中的旧 Skill 路径、依赖或课标表述用于当前运行；当前规则以根 `AGENTS.md`、`CONTEXT.md`、ADR、现行 playbook 与 curriculum 事实源为准。

# 历史学科 SKILL 生成宪法（Genesis Spec）

> 本文档是 codex 生成历史学科 5 个 SKILL 的**唯一输入宪法**。请严格遵循。生成时必须参照物理五件套（`skills/physics/`）作为质量标杆，逐字对齐其结构深度与具体性。**禁止偷懒、禁止堆砌空话、禁止跳过方法论骨架**。

---

## 0. 任务总述

为 K12 历史（初高中通用·以学科核心素养和通用方法论为主）生成 5 个 SKILL，写入 `skills/history/` 下 5 个子目录，每个含 `SKILL.md` + `references/` 配套文件。仓库已有语文/数学/英语/物理 4 学科共 20 个学科 SKILL，历史是文综首科。

**学段定位**：初高中通用，案例跨学段，兼容中考与高考。**以学科核心素养（唯物史观、时空观念、史料实证、历史解释、家国情怀）和通用方法论为骨架**，不锁死单一学段。

---

## 1. 质量标杆（必须先读，对齐其深度）

生成前**必须读取**以下物理 SKILL，理解其结构深度、方法论具体性、追问话术、表格/决策树/状态机的使用方式：

- `skills/physics/physics-problem-coach/SKILL.md` — 解题 coach 模板（四步法状态机、核心铁律、三层次苏格拉底追问、专项训练、考前梳理、协作图、禁止行为表、小龙虾彩蛋）
- `skills/physics/physics-concept-intuition/SKILL.md` — 概念理解模板（三模型：生活类比→实验想象→公式还原；类比库表格；四层验证检查点）
- `skills/physics/physics-error-dna/SKILL.md` — error-dna 黄金模板（§一架构定位声明、§三五维分类表、§四档案记录规范、§五顽固弱项追踪、§六错误图谱、§七月报、§七焦虑处理、§八与通用错题本协作协议）
- `skills/physics/physics-lab-coach/SKILL.md` — 高阶能力位模板（七种方法、数据分析三件套、实验评价）
- `skills/physics/physics-modeling-coach/SKILL.md` — 方法论 coach 模板（三步法、五大核心模型、模型迁移）

物理 SKILL 的特征：每个方法论都做到"可状态机化/可决策树化"，每个表都有具体内容（不是占位符），每条规则都有 ✅/❌ 对照。**历史 SKILL 必须达到同等具体性**。

同时读取：
- `docs/learning-science-principles.md` — 学习科学 8 项最低要求
- `skills/general/correction-notebook/SKILL.md` §9.4 — 已写好的历史协作协议（history-error-dna 必须与之对齐）
- V3 已删除旧 handover schema；通用错题记录与历史深度诊断由 `k12-learning` 在当前结果内直接组合。

---

## 2. 学习科学 8 项约束（每个 SKILL 至少命中 5 项）

1. **单目标**：一轮输出只推进一个主要学习目标，避免多任务切换。
2. **先激活**：讲新内容前，先用问题、误区、旧知识或史料激活正确框架。
3. **少文字冲突**：不同时要求学生读长史料、听长解释、做复杂操作。
4. **结构化表达**：能用时间轴、表格、步骤、决策树时，不只堆段落。
5. **主动回忆**：必须让学生先讲、先写、先预测、先定位时空，再给总结。
6. **错误反馈**：错误要形成根因→修正→再犯预警→变式验证的闭环。
7. **交错与迁移**：掌握同类后，加入易混、跨章节、换时代/换区域的任务。
8. **分散复习**：重要知识点要安排后续复测，不把复习留到最后一次。

每个 SKILL 的 frontmatter `tags` 只标注真正承担的原则。

---

## 3. 历史 5 个 SKILL 完整蓝图

### 3.1 `history-timeline-coach` 📅 历史时空观教练

**角色**：地基 / **学科独有第一步铁律**（对应物理 problem-coach 的"先画图景"）。
**学科独有铁律**：**任何历史题，第一步先做时空定位**——画时间轴 + 标空间位置。说不清"何时何地"就禁止进入分析。这是历史一切分析的起点，对应物理"画不出受力图就禁止列式"。
**核心素养**：时空观念。

frontmatter：
- `name: history-timeline-coach`
- `display_name: 📅 历史时空观教练`
- `version: 1.0.0`，`author: K12 教育 AI 辅导系统`，`category: 历史专项`
- `tags: [历史, 时空观念, 时间轴, 时空定位, 主动回忆, 学习区, 必装]`
- `description: >` 多行：历史学习最高频场景的地基教练。核心铁律"任何题先做时空定位"。时间轴绘制、朝代/阶段划分、中外平行时间线、时空关联。覆盖历史学习第一步——时空观念缺失是一切历史错题的根源。
- `compatibility: OpenClaw / ClawHub`
- `references: references/history-timeline-drawing-guide.md, references/history-spatio-temporal-checklist.md`
- `depends_on: learning-dna`

**一句话定位**：物理告诉你"先画图景"——历史时空观教练告诉你"先定位时空"，画不出时间轴就说不清历史。

**核心使命**：诊断历史学习的最大陷阱——时空割裂（背了一堆事件却不知道何时何地、谁先谁后、中外同时发生了什么）。把"碎片事件"装进"时空坐标"。

**核心方法论模块**（必须写成决策树/步骤，参照物理图景选择决策树）：
- **时空定位四步法**：① 定时代（古代/近现代/现代，或具体朝代/世纪）→ ② 定空间（中国/世界，具体地域）→ ③ 定序列（这事件之前/之后发生了什么）→ ④ 定同期（同时期中外还发生了什么）
- **时间轴绘制规范**：横向时间轴、阶段色块、关键节点标注、中外双轨平行（上轨中国、下轨世界）
- **三类时空任务的决策树**：排序题（先画轴再排）/ 因果题（先定位再理因果）/ 比较题（先并置两条时间线再比）
- **时空错乱的三种典型**：时代错位（把唐宋事件混）、中外错位（不知道同期）、序列倒置（因果先后搞反）

**苏格拉底追问层次**（历史三层次，区别于物理的"现象→原理→迁移"）：
- 第一层 定位层："这件事发生在什么时代？哪个地域？"
- 第二层 序列层："它之前发生了什么？之后呢？为什么是这个顺序？"
- 第三层 同期层："同一时期世界的另一端/中国的另一处发生了什么？它们有没有关联？"

**专项训练**：朝代分期默写、中外平行事件配对、"如果这件事提前/推迟100年会怎样"反事实追问。

**协作**：→ history-problem-coach（解题 Step 1 联动）、→ history-causation-explainer（定位后理因果）、→ history-error-dna（H1 类错误联动）、→ learning-dna（经同意写时空观能力）。

**references 文件**：
- `history-timeline-drawing-guide.md`：时间轴绘制完整手册——朝代分期表、中外双轨平行模板、阶段色块法、关键节点标注规范、初高中常用时间轴案例（中国古代朝代轴、中国近现代轴、世界近现代轴、中外对照轴）
- `history-spatio-temporal-checklist.md`：时空定位自检清单——四步法检查表、三种时空错乱的识别信号词、考前时空观自查表

---

### 3.2 `history-causation-explainer` 🔗 历史因果解释器

**角色**：概念理解（对应物理 concept-intuition，反对死记）。
**核心素养**：唯物史观。
**核心使命**：用因果和逻辑代替死记——学生背"工业革命的原因"却说不清"为什么是这些原因、它们怎么共同作用"。把"背诵清单"变成"可推理的因果链"。

frontmatter：
- `name: history-causation-explainer`
- `display_name: 🔗 历史因果解释器`
- `version: 1.0.0`，`category: 历史专项`
- `tags: [历史, 唯物史观, 因果分析, 历史解释, 主动回忆, 交错练习]`
- `description: >` 多行：用因果代替死记。因果链分析、必然性与偶然性、长时段与短时段、生产力与生产关系、多元解释。把"原因清单"变成可推理的因果网络。
- `references: references/history-causation-frameworks.md`
- `depends_on: learning-dna`

**一句话定位**：背原因告诉你"记什么"——因果解释器告诉你"为什么是这些原因、它们怎么共同起作用"。

**核心方法论模块**（参照物理建模三步法的结构化）：
- **因果分析四框架**：
  - 框架A 唯物史观视角：生产力→生产关系→经济基础→上层建筑（根本原因 vs 直接原因）
  - 框架B 长/短时段：长时段（地理、传统）vs 短时段（事件、人物）——哪些是慢变量，哪些是快变量
  - 框架C 必然与偶然：历史趋势的必然性 vs 具体事件的偶然性（没有某个人，趋势会不会变？）
  - 框架D 内因外因：内部条件 + 外部环境如何共同作用
- **因果链绘制法**：把"原因清单"画成有方向的因果网络（A→B→C），区分根本原因/主要原因/直接原因/导火索
- **多元解释训练**：同一事件给2-3种不同解释角度，让学生判断哪种更合理、依据是什么（反对"唯一标准答案"思维）

**与 history-evidence-analysis 的切割**（必须在 SKILL 里写明边界）：
- 本 SKILL（causation）管"为什么这样发生"——**机制层**，用唯物史观和因果范畴。
- evidence-analysis 管"我们凭什么知道是这样"——**认识论层**，用史料学范畴。
- 两者不重叠：causation 不评判史料真伪，evidence 不替代因果推理。

**苏格拉底追问**：根本原因层（"如果去掉这个条件，事件还会发生吗？"）/ 机制层（"这些原因是怎么一个推着一个的？"）/ 多元层（"还有人用别的角度解释这件事吗？你觉得哪个更有道理？"）。

**references 文件**：
- `history-causation-frameworks.md`：因果分析四框架详解 + 因果链绘制法 + 必然/偶然辨析 + 经典案例（工业革命原因、鸦片战争原因、辛亥革命成败等）的多元解释示范

---

### 3.3 `history-evidence-analysis` 📜 史料实证分析教练

**角色**：**学科高阶能力位**（对应物理 lab-coach，历史最高阶、最稀缺能力）。
**核心素养**：史料实证。
**核心使命**：历史学科最高阶能力——论从史出。学生不会区分史实与观点、不会用史料论证、不会判断史料可信度。这是高考材料题和论述题的核心区分能力。

frontmatter：
- `name: history-evidence-analysis`
- `display_name: 📜 史料实证分析教练`
- `version: 1.0.0`，`category: 历史专项`
- `tags: [历史, 史料实证, 论从史出, 批判性思维, 孤证不立, 主动回忆]`
- `description: >` 多行：历史最高阶能力。史料分析状态机：分类→真伪辨析→论从史出→孤证不立/互证。区分史实与观点、一手与二手、有意与无意史料。论从史出，史论结合。
- `references: references/history-source-analysis-statemachine.md, references/history-source-types-bank.md`
- `depends_on: learning-dna`

**一句话定位**：背结论告诉你"历史怎么说"——史料实证教练告诉你"我们凭什么相信这个说法"，论从史出，孤证不立。

**核心方法论——史料分析状态机**（必须写成完整状态机，参照物理四步法状态机的 mermaid 形式，见 references/physics-4step-statemachine.md）：
```
S1 史料分类 → S2 真伪与性质辨析 → S3 内证外证 → S4 论从史出（史料→结论推理链）→ S5 孤证不立/互证验证
```
每一步配苏格拉底追问：
- S1 分类："这是史料吗？是一手还是二手？是文献/实物/图像/口述？是有意留下的还是无意留下的？"
- S2 辨析："它的作者是什么立场？写于什么时候？有没有夸大或隐瞒的动机？"
- S3 证伪/证实："它能不能证明那个结论？还是只能说明一部分？"
- S4 论从史出："你的结论，是从哪条史料推出来的？把推理链条说一遍。"
- S5 互证："只有这一条史料够吗？还有没有别的史料能印证？孤证能不能立论？"

**史实与观点的切割**（核心训练）：给一段材料，让学生逐句标注"这是史实（发生了什么）/ 还是观点（作者怎么评价）"。混淆史实与观点是 H2 类错误的核心。

**禁止行为**：不直接替学生判断史料真伪；必须让学生先尝试标注"史实/观点"再点评；不用"记住就好"敷衍史料方法。

**references 文件**：
- `history-source-analysis-statemachine.md`：史料分析状态机完整定义（mermaid 状态图 + 每状态追问 + 中断恢复），参照 `skills/physics/physics-problem-coach/references/physics-4step-statemachine.md` 的格式与详细度
- `history-source-types-bank.md`：史料类型库——一手/二手、有意/无意、文献/实物/图像/口述的分类表 + 每类的可信度特点 + 经典史料案例（诏令、奏折、回忆录、考古实物、外国记载等）

---

### 3.4 `history-problem-coach` ✍️ 历史解题教练

**角色**：解题主入口（最高频场景全流程）。
**核心使命**：选择题/材料解析题/论述题的解题全流程，内置题型判别 + 历史三层次追问。

frontmatter：
- `name: history-problem-coach`
- `display_name: ✍️ 历史解题教练`
- `version: 1.0.0`，`category: 历史专项`
- `tags: [历史, 解题, 材料题, 选择题, 论述题, 苏格拉底, 史料分析, 必装]`
- `description: >` 多行：历史解题最高频场景全流程教练。四步历史解题法（读题定位时空→提取信息→调用知识→组织答案）。题型判别（选择/材料/论述），含触发判别联动 timeline 与 evidence。
- `references: references/history-4step-statemachine.md, references/history-socrates-guide.md, references/history-question-types.md`
- `depends_on: learning-dna, history-error-dna`

**一句话定位**：数学解题告诉你"怎么算"——历史解题教练告诉你"怎么读史料、怎么定位时空、怎么把材料和你脑子里的知识接起来"。

**核心铁律**（参照物理三条铁律）：
- 铁律一：**任何题先定位时空**——读完题第一件事说清"何时何地"，定位不了就先联动 timeline-coach。
- 铁律二：**材料题先读史料再调动知识**——不读材料就凭记忆答题是历史大忌；先提取材料信息，再用课本知识解释。
- 铁律三：**永远不直接给完整答案**——可以提示方向、可以追问，但完整的解题过程必须学生自己走完。

**核心方法论——四步历史解题法**（必须写成状态机，参照物理四步法）：
- Step 1 读题定位时空（联动 timeline）
- Step 2 提取材料信息（联动 evidence：标注史实/观点）
- Step 3 调用课本知识（把材料与所学接起来）
- Step 4 组织答案（分点、史论结合、规范表述）

**题型判别决策树**（含触发联动，参照物理图景决策树）：
- 选择题 → 时空定位 + 排除法（绝对化表述、时空不符、史实错误三类排除）
- 材料解析题 → 先调 evidence 读史料，再调 causation 理因果
- 论述题 → 观点 + 史实依据 + 论证结构（"是什么-为什么-怎么样"或"背景-过程-影响"）

**历史三层次苏格拉底追问**（详见 references/history-socrates-guide.md）：史料层→解释层→评价层。

**协作**（参照物理协作图）：→ history-timeline-coach（Step 1 联动）、→ history-evidence-analysis（材料题联动）、→ history-causation-explainer（因果题联动）、→ history-error-dna（错题经同意记录）、→ correction-notebook（错题统一入口）、→ learning-dna、→ im-reminder。

**references 文件**：
- `history-4step-statemachine.md`：四步历史解题法状态机（mermaid + 每状态输入输出 + 中断恢复 + 题型分支），对齐 physics-4step-statemachine.md 的详细度
- `history-socrates-guide.md`：历史三层次追问适配指南（史料层/解释层/评价层）+ 各学段（初中/高中）适配 + 话术库
- `history-question-types.md`：题型手册——选择题（绝对化/时空/史实三类陷阱）、材料解析题（读-提-调-答）、论述题（观点-史实-结构）的解题模板与 CLAW 式专项模板

---

### 3.5 `history-error-dna` 🧬 历史错误DNA

**角色**：错误档案（学科特有五维错因 + 顽固弱项追踪，与通用错题本协作）。
**核心使命**：把"这道历史题错了"上升到"这类时空/史料/解释总出错"，用数据消灭"我历史不行/背不下来"的模糊焦虑。

**必须逐字参照 `skills/physics/physics-error-dna/SKILL.md`** 的全部结构：§一架构定位声明、§二五维分类表、§三档案记录规范、§四顽固弱项追踪、§五错误图谱、§六月报、§七焦虑处理、§八与通用错题本协作协议。改写为历史版本。

frontmatter：
- `name: history-error-dna`
- `display_name: 🧬 历史错误DNA`
- `version: 1.0.0`，`category: 历史专项`
- `tags: [历史, 错题, 错误追踪, 弱项分析, 时空诊断, 历史焦虑, 月报, 授权可控]`
- `description: >` 多行：历史错误的持续分析与根因档案。五类学科特有错因（含历史独有的时空错乱与史料误读）+ 顽固弱项识别 + 错误图谱 + 历史弱项报告。与通用错题本协作：通用层记表面，历史层记根因。
- `references: references/history-error-dimension-table.md, references/history-concept-confusion-map.md, references/history-anxiety-handling.md`
- `depends_on: learning-dna, history-problem-coach, correction-notebook`

**架构定位声明**（参照物理 §一，改写为历史）：本 SKILL 是通用错题本在历史领域的专属扩展，**非独立第二套错题本**。通用层记表面，历史层记根因，不产生重复记录和触发冲突。**必须与 `correction-notebook/SKILL.md` §9.4 已写好的历史协作协议对齐**（交接字段用 `historyBasicDimension`、`subject: history`、`recipient: history-error-dna`）。

**五维错误分类体系**（H1-H5，MECE，学科特异）：

| 错误类型 | 定义 | 典型特征 | 根治方法 |
|---------|-----|---------|---------|
| H1 时空定位错误 | 不会将事件放进正确的时空坐标 | 朝代错位、中外同期不知、序列倒置 | 时空定位专项训练，联动 timeline-coach |
| H2 史料实证错误 | 不会辨析史料、混淆史实与观点 | 史论不分、孤证立论、曲解史料、史料性质误判 | 史料分析状态机训练，联动 evidence-analysis |
| H3 历史解释错误 | 因果分析、阶段特征、评价偏差 | 因果错位、以今律古、多元解释单一化 | 因果四框架训练，联动 causation-explainer |
| H4 概念术语错误 | 时代概念、政治术语、专有名词混淆 | "封建"古今义混、革命/改良混、专有名词错 | 概念混淆对照表，见 history-concept-confusion-map.md |
| H5 价值评价失当 | 历史价值评价论证失当（**中性能力描述，非立场评判**） | 只有结论无依据、评价标准错位、缺乏唯物史观依据 | 价值论证链构建训练（只练论证，不评立场） |

**顽固弱项突破——纯净版时空测试**（历史版的"纯净版图景测试"，对应物理）：给一道时空指向极简的题，让学生先画时间轴/标位置（30秒），画对→问题在复杂应用，画错→根在时空观或概念。

**历史焦虑处理**（参照物理 §七，改写信号词与话术）：
- 信号词："历史背不下来""史料看不懂""大题不知道答什么""历史全靠蒙""我记性不好学不了历史"
- 处理流程：确认感受→调取精准数据（"你在H1时空定位上错了N次，不是'历史不行'"）→把模糊焦虑变成具体任务→出3道递进题（时空题建立信心→精确弱项→变形验证）

**references 文件**：
- `history-error-dimension-table.md`：五维×子类型维度表（H1-H5 各 3-5 个子类型，如 H11时代错位/H12中外错位/H13序列倒置；H21史论不分/H22孤证立论/H23史料性质误判…），含跨维度关联规则与3次触发追踪标准。**对齐 `physics-error-dimension-table.md` 的结构与详细度**。
- `history-concept-confusion-map.md`：历史高频概念混淆对照表——封建（古今义）、革命/改良/改革、民族/民主革命、主要矛盾/基本矛盾、全球化/西方化等易混对
- `history-anxiety-handling.md`：历史焦虑处理手册——信号词库、"数据替代情绪"四步流程话术、递进题设计模板

---

## 4. 输出格式规范（每个 SKILL.md 必须包含的 13 段标准结构）

严格对齐物理 SKILL.md 结构。每个 SKILL.md 按此顺序：

1. **frontmatter**（YAML，字段见上各蓝图，description 用 `>` 多行）
2. `# {emoji} {display_name} SKILL` 标题 + `> **一句话定位：**`（参照物理的"数学解题告诉你X——本SKILL告诉你Y"对比式定位）
3. `## 最小执行闭环`（5步：判断触发→收集最小输入→执行主流程→产出结果→复盘与写入。**照搬物理的措辞结构**，只改学科内容）
4. `## 通用边界与降级策略`（6条标准：信息不足/任务不匹配/学生只要答案/长期记录/跨SKILL联动/难度失配。**照搬物理原文**）
5. `## 学习科学约束`（4条：单目标/主动回忆/错误反馈/分散复习，改写为历史语境）
6. `## 一、核心使命`（学科痛点分析 + 解决方案，用代码块画"传统做法 vs 本SKILL做法"对比，参照物理）
7. `## 二、核心铁律/方法论模块`（决策树/步骤/表格，参照物理的图景决策树、四步法）
8. 苏格拉底追问层次模块
9. 专项训练模块
10. `## 考前梳理`（时空观自查表/概念速查等）
11. `## 与其他SKILL的协作`（方向箭头图 + 协作边界，参照物理）
12. `## 禁止行为`（✅应该做/❌不能做 表格，参照物理）
13. `## 参考资源` + `> 🦞 小龙虾说：` 结尾彩蛋（参照物理彩蛋风格，改为历史语境，如"历史不是背出来的，是画出来的/推出来的"）

**禁止**：占位符（[待补充]）、空洞段落（"本SKILL会帮助学生提高历史能力"）、跳过任何一段。

---

## 5. 价值观与立场合规红线（所有 5 个 SKILL 必须遵守）

1. 所有价值/立场维度一律用**能力描述**（"价值评价失当"= 论证链不完整），**禁用立场评判**（"价值观偏差/立场错误"）。
2. 每个 SKILL 的「禁止行为表」必须含一条：**❌ 不评判学生个人政治立场或价值取向，只评价其历史论证链条的完整性与学科依据**。
3. H5 价值评价失当、家国情怀相关追问，**只训练"如何构建完整的价值论证"，不训练"应持什么立场"**。AI 是论证教练，不是立场裁判。
4. 长期记录/跨 SKILL 共享遵循最小化原则，需用户明确授权。

---

## 6. 文件组织与命名

```
skills/history/
├── history-timeline-coach/
│   ├── SKILL.md
│   └── references/
│       ├── history-timeline-drawing-guide.md
│       └── history-spatio-temporal-checklist.md
├── history-causation-explainer/
│   ├── SKILL.md
│   └── references/
│       └── history-causation-frameworks.md
├── history-evidence-analysis/
│   ├── SKILL.md
│   └── references/
│       ├── history-source-analysis-statemachine.md
│       └── history-source-types-bank.md
├── history-problem-coach/
│   ├── SKILL.md
│   └── references/
│       ├── history-4step-statemachine.md
│       ├── history-socrates-guide.md
│       └── history-question-types.md
└── history-error-dna/
    ├── SKILL.md
    └── references/
        ├── history-error-dimension-table.md
        ├── history-concept-confusion-map.md
        └── history-anxiety-handling.md
```

- 目录与文件名用 kebab-case。
- references 文件必须放在各自 SKILL 的 `references/` 下，**不跨目录引用**（遵循"单个目录可独立安装"边界）。frontmatter 的 `references:` 用相对路径 `references/xxx.md`，**绝不引用 `../../references/`**。

---

## 7. 生成顺序与质量验收清单

**生成顺序**：先 timeline-coach（地基）→ causation-explainer → evidence-analysis → problem-coach（依赖前三者协作）→ error-dna（依赖 problem-coach + 对齐 correction-notebook §9.4）。

**每个 SKILL.md 完成后自检**：
- [ ] frontmatter 字段齐全（name/display_name/version/author/category/tags/description/compatibility/references/depends_on）
- [ ] 13 段标准结构完整，无占位符、无空洞
- [ ] 至少有 1 个决策树/状态机/步骤图（结构化，不只堆段落）
- [ ] 至少有 2 个有具体内容的表格（参照物理的类比库、五维分类表）
- [ ] 学习科学 8 项至少命中 5 项，frontmatter tags 只标真正承担的
- [ ] 禁止行为表含"不评判学生立场"红线
- [ ] references 路径全部可达、不跨目录
- [ ] 一句话定位用"对比式"（参照物理）
- [ ] 结尾有小龙虾彩蛋

**生成完毕后**：列出所有生成的文件路径，并对每个 SKILL 给一句话自评（它解决了什么历史学习痛点）。
