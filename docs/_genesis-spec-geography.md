# 地理学科 SKILL 生成宪法（Genesis Spec）

> codex 生成地理学科 5 个 SKILL 的**唯一输入宪法**。严格遵循。**双标杆参照**：物理五件套（`skills/physics/`，结构深度）+ 已验证的历史五件套（`skills/history/`，文科适配范例、同模式刚通过课标核实与 darwin 优化）。禁止偷懒、占位符、空洞段落。

---

## 0. 任务总述

为 K12 地理（初高中通用·以学科核心素养和通用方法论为主）生成 5 个 SKILL，写入 `skills/geography/` 下 5 个子目录，每个含 `SKILL.md` + `references/`。

**学段定位**：初高中通用，案例跨学段，兼容中考高考。**以四大核心素养（人地协调观、综合思维、区域认知、地理实践力）和通用方法论为骨架**。

---

## 1. 质量标杆（必须先读，对齐其深度）

- `skills/physics/` 五件套 — 结构深度、状态机/决策树/表格的具体性
- `skills/history/` 五件套 — **文科适配范例**（时空定位铁律、史料状态机、H1-H5错因、§9.4协作协议），刚通过课标网络核实与 darwin 优化（平均87.3），地理必须对齐其质量
- `docs/learning-science-principles.md` — 8 项最低要求
- `skills/general/correction-notebook/SKILL.md` §9.4 — 历史协作协议范例（地理协作协议 §9.5 待写入，结构与 §9.4 同构）
- `skills/general/skill-coordinator/schemas/handover-protocol.schema.json` — 交接 schema（地理待扩展 `geographyBasicDimension`/`subject:"geography"`）

---

## 2. 学习科学 8 项约束（每 SKILL 至少命中 5 项）

单目标 / 先激活（先读图、先定位）/ 少文字冲突 / 结构化表达（图、表、决策树）/ 主动回忆（学生先说、先标、先判图）/ 错误反馈（根因→修正→再犯预警→变式验证）/ 交错迁移（换区域、换图型）/ 分散复习。

---

## 3. 地理 5 个 SKILL 完整蓝图

### 3.1 `geography-map-coach` 🗺️ 地理读图定位教练

**角色**：地基 / **学科独有第一步铁律**（对应物理 problem-coach "先画图景"、历史 timeline "先定位时空"）。
**学科独有铁律**：**"无图不题"——任何地理题先读图、先把文字信息变成地图/图表**。地理学科认同度最高的铁律。读不懂图就禁止进入原理分析。
**核心素养**：区域认知 + 地理实践力。

frontmatter：`name: geography-map-coach`，`display_name: 🗺️ 地理读图定位教练`，`version: 1.0.0`，`category: 地理专项`，`tags: [地理, 读图, 空间定位, 地图三要素, 经纬网, 等值线, 主动回忆, 学习区, 必装]`，`description: >`（地理最高频地基教练。铁律"无图不题"。读图四步法、地图三要素、经纬网定位、等值线判读、统计图、图图转换。），`references: references/geography-map-reading-guide.md, references/geography-map-types-bank.md`，`depends_on: learning-dna`。

**核心方法论**：
- **读图四步法**：① 看图名图例比例尺（地图三要素）→ ② 定位置（经纬网/海陆/相对位置）→ ③ 提取信息（数值/分布/趋势）→ ④ 判断规律与异常
- **四类图判读决策树**：分布图（看疏密/走向）→ 统计图（看结构/变化趋势）→ 示意图（看过程/关系）→ 景观图（看特征/成因）
- **空间定位三法**：经纬网定位、海陆轮廓定位、相对位置定位
- **等值线判读五原则**：同线等值、疏密差异、走向、弯曲、闭合

**苏格拉底三层次**：读图层（"图名图例告诉你什么"）→ 定位层（"这是哪里？经纬度多少"）→ 规律层（"数值分布呈现什么规律？哪里异常"）。

**references**：
- `geography-map-reading-guide.md`：读图四步法完整手册、四类图判读决策树、经纬网/等值线判读规范、初高中常用图型案例
- `geography-map-types-bank.md`：地图类型库（等值线图/统计图/示意图/景观图/区域图/剖面图）的判读要点与易错点

### 3.2 `geography-region-analyzer` 🏞️ 区域综合分析教练

**角色**：学科方法论（对应物理 modeling-coach、历史 causation 的方法论位）。
**核心素养**：区域认知。
**核心使命**：把"区域特征背诵"变成"要素关联推理"——区域不是要素清单，是要素之间相互作用的整体。

frontmatter：`name: geography-region-analyzer`，`display_name: 🏞️ 区域综合分析教练`，`tags: [地理, 区域认知, 区域分析, 要素关联, 综合思维, 主动回忆]`，`references: references/geography-region-analysis-framework.md`，`depends_on: learning-dna`。

**核心方法论——区域分析五步框架**：
1. **位置界定**：经纬度+海陆+相对位置（位置决定其他要素）
2. **要素提取**：自然要素（地形/气候/水文/土壤/生物/资源）+ 人文要素（人口/城市/农业/工业/交通/文化）
3. **要素关联（核心步，反对清单式罗列）**：每个自然要素如何影响其他自然要素、如何影响人文要素（如气候→水文→农业）
4. **区域特征概括**：从要素关联中提炼区域总体特征
5. **区域差异比较**：选对比较维度，不跨尺度硬比

**人地协调横切**：在要素关联中追问"这种资源利用方式可持续吗？人类活动如何改变了这里的自然过程？"（人地协调观作为横切关注点，不单独成 SKILL）。

**references**：`geography-region-analysis-framework.md`：五步框架详解、要素关联矩阵模板、区域对比维度表、经典区域案例（如某流域/某国家/某工业区）。

### 3.3 `geography-process-explainer` 🌦️ 地理过程机制解释器

**角色**：**学科高阶能力位**（对应物理 lab-coach、历史 evidence-analysis）。
**核心素养**：综合思维。
**核心使命**：地理最高阶能力——用因果机制理解地理过程，而非死记结论。学生背"洋流形成原因"却说不清机制。

**核心方法论——地理过程推理四步法**：
1. **过程识别**：这是哪类地理过程？（水循环/大气环流/洋流/热力环流/人口迁移/城市化）
2. **因子分解**：哪些因子驱动这个过程？（如水循环：蒸发、水汽输送、降水、径流）
3. **机制推理（核心）**：每个因子如何起作用？因子间如何叠加？（如洋流：盛行风+地转偏向力+海陆轮廓共同作用）
4. **结论验证**：换一个区域/条件，结论还成立吗？

**超纲边界（必写）**：自然地理机制（三圈环流、洋流成因、热力性质差异）是高中必修要求；初中降级为"现象识别 + 单一因子解释"，不要求多因子叠加机制。作为高阶 SKILL 训练高中综合思维合理，但需在"各学段适配"明确降级。

**references**：`geography-process-reasoning-methods.md`：过程推理四步法、六大类地理过程的因子-机制表（水循环/大气/洋流/热力/人口/城市）、反事实验证模板。

### 3.4 `geography-problem-coach` ✍️ 地理解题教练

**角色**：解题主入口。
**核心铁律**：① 任何题先读图定位 ② 自然题先理机制/人文题先析结构 ③ 永不直接给完整答案。

**核心方法论——四步地理解题法**：读图定位 → 调用原理 → 逻辑推理 → 规范作答。
**题型判别决策树**：过程机制题→调 process-explainer；区域分析题→调 region-analyzer；计算题→用自然地理计算模块。
**自然地理计算**：时区计算、比例尺计算、太阳高度角（高中）、人口密度、海拔相对高度（等值线）。

frontmatter：`tags: [地理, 解题, 综合题, 选择题, 自然计算, 苏格拉底, 必装]`，`references: references/geography-4step-statemachine.md, references/geography-socrates-guide.md, references/geography-question-types.md, references/geography-natural-calculation.md`，`depends_on: learning-dna, geography-error-dna`。

**references**：四步状态机（对齐 physics/history-4step-statemachine）、苏格拉底追问指南（读图层→原理层→评价层）、题型手册、自然地理计算手册（时区/比例尺/太阳高度/人口密度）。

### 3.5 `geography-error-dna` 🧬 地理错误DNA

**角色**：错误档案。**逐字参照 `physics-error-dna` 与 `history-error-dna` 的全部八节结构**（架构声明/五维分类/档案规范/顽固弱项/错误图谱/月报/焦虑处理/协作协议）。

**五维错误分类（G1-G5，MECE，学科特异）**：

| 错误类型 | 定义 | 典型特征 | 根治方法 |
|---------|-----|---------|---------|
| G1 读图与空间定位错误 | 读不懂图、定位错（学科独有P类） | 经纬网判错、等值线误读、空间关系乱、地图三要素漏 | 读图四步法专项，联动 map-coach |
| G2 地理概念/原理错误 | 概念混、原理用错 | 天气/气候混、水资源/水能资源混、人口流动/迁移混 | 概念混淆对照表 |
| G3 地理过程推理错误 | 因子遗漏、机制反向、叠加错（高阶） | 洋流成因漏因子、热力环流方向反 | 过程推理四步法，联动 process-explainer |
| G4 区域综合分析错误 | 要素关联遗漏、特征概括偏、比较维度缺 | 只罗列要素不说关联、跨尺度硬比 | 区域五步框架，联动 region-analyzer |
| G5 地理计算与表达错误 | 计算错、术语不规范 | 时区算错、太阳高度错、术语口语化 | 计算手册+术语规范 |

**顽固弱项突破——纯净版读图测试**（地理版图景测试）：给一张极简图，让学生先读图说信息（30秒），读对→问题在原理应用，读错→根在读图。

**焦虑信号词**："地理图我从来读不懂""自然地理太难""大题不知道答什么"→"数据替代情绪"四步流程。

frontmatter：`tags: [地理, 错题, 错误追踪, 弱项分析, 读图诊断, 地理焦虑, 月报, 授权可控]`，`references: references/geography-error-dimension-table.md, references/geography-concept-confusion-map.md, references/geography-anxiety-handling.md`，`depends_on: learning-dna, geography-problem-coach, correction-notebook`。

**协作协议**：与 correction-notebook §9.5（待写入）对齐，handover 用 `subject:"geography"`、`recipient:"geography-error-dna"`、`geographyBasicDimension`。

**references**：error-dimension-table（G1-G5×子类型，对齐 history/physics-error-dimension-table）、concept-confusion-map（地理高频概念混淆）、anxiety-handling（地理焦虑信号词+流程）。

---

## 4. 输出格式规范（13 段标准结构，同历史/物理）

frontmatter → 标题+一句话定位（对比式）→ 最小执行闭环(5步) → 通用边界(6条) → 学习科学约束 → 核心使命(痛点对比) → 核心铁律/方法论模块(决策树/状态机/表格) → 苏格拉底三层次追问 → **各学段适配（必须有，参照 history）** → 专项训练 → 考前梳理 → 协作关系图+边界 → 禁止行为表(✅/❌) → 参考资源 → 小龙虾彩蛋。

**禁止**：占位符、空洞段落、跳过方法论骨架、跳过各学段适配。

---

## 5. 价值观与立场合规红线

1. 人地协调观作为**横切关注点**融入 region-analyzer 与 process-explainer（追问可持续性），**不单独成 SKILL**。
2. 所有价值维度用**能力描述**，禁用立场评判。
3. 每个 SKILL 禁止行为表必须含：**❌ 不评判学生个人立场或价值取向，只评价其地理论证链条的完整性与学科依据**。
4. 长期记录/跨 SKILL 共享需用户明确授权。

---

## 6. 文件组织

```
skills/geography/
├── geography-map-coach/{SKILL.md, references/{geography-map-reading-guide.md, geography-map-types-bank.md}}
├── geography-region-analyzer/{SKILL.md, references/geography-region-analysis-framework.md}
├── geography-process-explainer/{SKILL.md, references/geography-process-reasoning-methods.md}
├── geography-problem-coach/{SKILL.md, references/{geography-4step-statemachine.md, geography-socrates-guide.md, geography-question-types.md, geography-natural-calculation.md}}
└── geography-error-dna/{SKILL.md, references/{geography-error-dimension-table.md, geography-concept-confusion-map.md, geography-anxiety-handling.md}}
```

- kebab-case；references 在各自 SKILL 的 `references/` 下，**不跨目录引用**；frontmatter `references:` 用 `references/xxx.md` 相对路径，**绝不引用 `../../`**。

---

## 7. 地理超纲风险（验证重点，codex 生成时注意学段边界）

- **自然地理机制**（三圈环流、洋流成因、热力性质差异、大气受热过程）：高中必修；初中降级为现象识别 + 单因子解释。
- **地理过程多因子叠加推理**：高阶能力（对标学业质量水平3-4），作为高阶 SKILL 目标合理，但需"各学段适配"明确降级。
- **太阳高度角计算**：高中要求，初中不要求。
- **区域可持续发展深度**：高中选修/必修差异，初中只要求基础人地关系。

---

## 8. 生成顺序与质量验收清单

**顺序**：map-coach（地基）→ region-analyzer → process-explainer → problem-coach → error-dna。

**每 SKILL 自检**：13 段完整、≥1 决策树/状态机、≥2 实质表格、学习科学命中≥5、各学段适配段必须有、禁止行为含红线、references 不跨目录、对比式一句话定位、小龙虾彩蛋。

**完成后**：输出文件清单 + 每 SKILL 一句话自评。
