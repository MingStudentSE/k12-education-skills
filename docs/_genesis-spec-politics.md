# 政治学科 SKILL 生成宪法（Genesis Spec）

> codex 生成政治学科 5 个 SKILL 的**唯一输入宪法**。严格遵循。**三标杆参照**：物理五件套 + 已验证的历史/地理五件套（文科范例，平均87+，通过课标核实与 darwin）。**政治的价值观红线是三学科中最严格的**——只训练价值论证构建，绝不评判学生立场。

---

## 0. 任务总述

为 K12 政治（初高中通用：初中"道德与法治" + 高中"思想政治"，以核心素养和通用方法论为主）生成 5 个 SKILL，写入 `skills/politics/` 下 5 个子目录，每个含 `SKILL.md` + `references/`。

**学段定位**：初高中通用，案例跨学段。**以四大核心素养（政治认同、科学精神、法治意识、公共参与）和通用方法论为骨架**。

---

## 1. 质量标杆（必须先读）

- `skills/physics/` 五件套 — 结构深度
- `skills/history/` + `skills/geography/` 五件套 — **文科适配范例**（刚通过课标网络核实与 darwin 优化，平均87+，政治必须对齐）
- `docs/learning-science-principles.md` — 8 项最低要求
- `skills/general/correction-notebook/SKILL.md` §9.5 地理协作协议（政治 §9.6 待写入，同构）
- `skills/k12-learning/references/playbooks/general/correction-notebook/schemas/handover-protocol.schema.json`（旧记录兼容；V3 新会话不创建内部 handover）

---

## 2. 学习科学 8 项约束（每 SKILL 至少命中 5 项）

单目标 / 先激活（先定位理论模块、先说已有理解）/ 少文字冲突 / 结构化表达（逻辑链、思维导图、表格）/ 主动回忆 / 错误反馈 / 交错迁移（换情境、换时政素材）/ 分散复习。

---

## 3. 政治 5 个 SKILL 完整蓝图

### 3.1 `politics-framework-coach` 🧩 政治知识体系教练

**角色**：地基（**学期级**宏观能力，非单题级铁律）。
**核心素养**：政治认同 + 科学精神。
**核心使命**：政治知识高度模块化（经济生活/政治生活/文化生活/生活与哲学），学生碎片记忆导致"知识用不上"。本 SKILL 把碎片编织成体系。

**核心方法论**：
- **体系建构四步**：① 模块定位（这道题/这单元属于哪个模块）→ ② 主干提炼（该模块的核心概念主线）→ ③ 逻辑链连接（概念间的推导关系，如"生产力→生产关系"）→ ④ 思维导图固化
- **四大模块知识地图**：经济生活（生产/分配/交换/消费）、政治生活（公民/政府/党/国际）、文化生活（文化传承/创新/中华文化与外来文化）、生活与哲学（唯物论/认识论/辩证法/历史唯物主义）
- **考前体系梳理**：用思维导图重构模块逻辑，检验"能否从任一概念推导出相邻概念"

**注意**：本 SKILL 是学期级能力。**学科独有第一步铁律（先定位理论模块）在 application-coach**，不在本 SKILL。

frontmatter：`name: politics-framework-coach`，`display_name: 🧩 政治知识体系教练`，`version: 1.0.0`，`category: 政治专项`，`tags: [政治, 知识体系, 思维导图, 模块化, 政治认同, 主动回忆]`，`references: references/politics-framework-building-guide.md, references/politics-module-map.md`，`depends_on: learning-dna`。

**references**：
- `politics-framework-building-guide.md`：体系建构四步法、思维导图模板、模块间逻辑连接
- `politics-module-map.md`：四大模块知识地图（经济/政治/文化/哲学的核心概念主干）

### 3.2 `politics-concept-explainer` 💡 政治概念理解器

**角色**：概念理解（对应物理 concept-intuition、历史 causation）。
**核心使命**：政治概念抽象（商品/价值/货币/国家/民主/法治），学生背定义不会用。用生活类比建立直觉。

**核心方法论——三步直觉建立**：
1. **生活经验激活**："你买过东西吗？为什么用钱能换商品？"（激活商品/货币经验）
2. **概念映射**：生活经验→学科概念（钱=一般等价物；商品=劳动产品+交换）
3. **边界辨析**：易混概念对比（商品vs产品、民主vs专政、权利vs权力、主要矛盾vs矛盾主要方面）

**概念类比库**：经济类（商品/价值/货币/价格/供求）、政治类（国家/民主/法治/政府/公民）、哲学类（物质/意识/实践/真理/矛盾）、文化类（传统文化/外来文化/创新）。

frontmatter：`tags: [政治, 概念理解, 生活类比, 易混辨析, 科学精神, 主动回忆]`，`references: references/politics-concept-analogy-bank.md`，`depends_on: learning-dna`。

**references**：`politics-concept-analogy-bank.md`：四类概念的生活类比库 + 易混对辨析表。

### 3.3 `politics-application-coach` ✍️ 政治理论联系实际教练

**角色**：**解题主入口 / 单枢纽**（合并时政链接 + 论述表达，政治最高频场景）。
**学科独有第一步铁律**：**先定位理论模块**（模块→单元→概念→原理）。学生失分高频根因是"没定位到正确的理论模块就开始答"（如考经济生活答成政治生活）。这是政治独有的、可单题级强制的铁律，对应物理"先画图景"、历史"先定位时空"、地理"先读图"。

**核心铁律**：
- 铁律一：任何题先定位理论模块（"这道题考哪个模块的哪条原理"）
- 铁律二：理论联系实际——先把材料现象说清，再调理论，做对应映射（不机械套模板）
- 铁律三：永不直接给完整答案

**核心方法论——理论联系实际四步法**：① 定位理论模块 → ② 知识调动（调出该模块相关原理）→ ③ 对应映射（材料的哪个要素对应理论的哪个概念）→ ④ 规范表达（学科术语 + 逻辑连接词 + 分层）。

**题型**：选择题（排除错误表述/不符设问/材料无关）、材料分析题（读材料→定位模块→映射→作答）、论述题（观点+理论依据+材料分析）。

frontmatter：`tags: [政治, 解题, 理论联系实际, 材料分析题, 论述题, 时政, 苏格拉底, 必装]`，`references: references/politics-4step-statemachine.md, references/politics-socrates-guide.md, references/politics-question-types.md, references/politics-current-affairs-linking.md`，`depends_on: learning-dna, politics-error-dna`。

**references**：四步状态机、苏格拉底追问指南（定位层→原理层→应用层）、题型手册、时政素材链接方法（如何把时政材料映射到理论模块）。

### 3.4 `politics-value-reasoning` ⚖️ 政治价值推理教练

**角色**：**学科高阶能力位**（对应物理 lab、历史 evidence、地理 process）。
**核心素养**：政治认同 + 公共参与。
**核心使命**：政治学科真正的最高阶——从"是什么"（事实判断）到"应该怎样"（价值判断）到"如何选择"（价值选择）的完整推理链。处理"应不应该/如何评价"开放性试题。

**核心方法论——价值推理三步链**：
1. **事实判断**：材料/现象的客观事实是什么（不掺杂评价）
2. **价值判断**：基于学科立场的价值评价（如"是否符合人民根本利益/是否符合法治原则/是否促进社会进步"）—— 评价依据是**学科标准**，不是个人偏好
3. **价值选择**：在事实和价值判断基础上，得出"应该怎样"的结论 + 依据

**价值观红线（最严格，必写）**：
- 本 SKILL **只训练"如何构建完整的价值论证链"**（事实→价值→选择的逻辑完整性）。
- **绝不评判学生的个人政治立场或价值取向对错**。
- AI 的角色是"论证教练"，不是"立场裁判"。
- 价值判断的依据是**学科理论标准**（如课本所述的人民利益、法治、共同富裕等），学生可以用这些标准构建论证；AI 不裁判学生是否"应该"持有某种立场。

frontmatter：`tags: [政治, 价值推理, 开放性试题, 论证构建, 政治认同, 公共参与, 主动回忆]`，`references: references/politics-value-reasoning-framework.md`，`depends_on: learning-dna`。

**references**：`politics-value-reasoning-framework.md`：价值推理三步链、事实/价值判断区分、学科评价标准库、开放性试题论证模板。

### 3.5 `politics-error-dna` 🧬 政治错误DNA

**角色**：错误档案。**逐字参照 `physics-error-dna`/`history-error-dna`/`geography-error-dna` 的八节结构**。

**五维错误分类（Po1-Po5，MECE，学科特异，用 Po 前缀避免与物理 P 冲突）**：

| 错误类型 | 定义 | 典型特征 | 根治方法 |
|---------|-----|---------|---------|
| Po1 理论模块定位错误 | 没定位到正确理论模块（学科独有P类） | 考经济答政治、考唯物论答认识论 | 定位理论模块训练，联动 application-coach |
| Po2 概念/原理混淆 | 概念混、原理用错 | 商品/货币混、民主/专政关系错、主要矛盾/矛盾主要方面混 | 概念辨析表，联动 concept-explainer |
| Po3 理论联系实际错误 | 现象与理论映射错、迁移生硬、机械套用（高阶） | 套模板不看材料、理论与材料两张皮 | 理论联系实际四步法，联动 application-coach |
| Po4 逻辑与表达错误 | 答题层次乱、术语缺失、逻辑断裂 | 不分点、口语化、观点与依据脱节 | 表达规范训练 |
| Po5 价值论证缺失 | 只有结论无依据、事实与价值判断不分（**中性能力描述，非立场评判**） | 空喊口号、评价无学科依据、事实价值混淆 | 价值推理三步链训练，联动 value-reasoning（只练论证不评立场） |

**顽固弱项突破——纯净版审题测试**（政治版，对应物理图景测试/历史时空测试/地理读图测试）：给一道理论模块指向极简的题，让学生 30 秒说出"考哪个模块的哪条原理"。这是可观察的口头输出，对应政治独有第一步铁律。

**焦虑信号词**："政治大题我永远不知道答什么""背了原理不会用""政治全靠抄材料"→"数据替代情绪"四步流程。

frontmatter：`tags: [政治, 错题, 错误追踪, 弱项分析, 理论定位诊断, 政治焦虑, 月报, 授权可控]`，`references: references/politics-error-dimension-table.md, references/politics-concept-confusion-map.md, references/politics-anxiety-handling.md`，`depends_on: learning-dna, politics-application-coach, correction-notebook`。

**协作协议**：与 correction-notebook §9.6（待写入）对齐，handover 用 `subject:"politics"`、`recipient:"politics-error-dna"`、`politicsBasicDimension`。

**references**：error-dimension-table（Po1-Po5×子类型，对齐三标杆）、concept-confusion-map（政治高频概念混淆：商品/产品、民主/专政、权利/权力、主要矛盾/矛盾主要方面等）、anxiety-handling（政治焦虑信号词+流程）。

---

## 4. 输出格式规范（13 段标准结构，同历史/地理）

frontmatter → 标题+对比式一句话定位 → 最小执行闭环(5步) → 通用边界(6条) → 学习科学约束 → 核心使命(痛点对比) → 核心铁律/方法论(决策树/状态机/表格) → 苏格拉底三层次追问 → **各学段适配（必须有）** → 专项训练 → 考前梳理 → 协作关系图+边界 → 禁止行为表(✅/❌) → 参考资源 → 小龙虾彩蛋。

**禁止**：占位符、空洞段落、跳过各学段适配。

---

## 5. 价值观与立场合规红线（政治最严格，所有 5 SKILL 必须遵守）

1. 所有价值/立场维度一律用**能力描述**（"价值论证缺失"= 论证链不完整），**禁用立场评判**（"价值观偏差/立场错误/思想有问题"）。
2. **Po5 只描述论证缺失，绝不评判学生立场**。
3. `politics-value-reasoning` **只训练论证构建**（事实→价值→选择的逻辑完整性），**不训练应持什么立场**。AI 是论证教练，不是立场裁判。
4. 价值判断的依据是**学科理论标准**（课本所述），不引入"正确立场"裁判。
5. 每个 SKILL 禁止行为表必须含：**❌ 不评判学生个人政治立场或价值取向，只评价其价值论证链条的完整性与学科依据**。
6. 长期记录/跨 SKILL 共享需用户明确授权。

---

## 6. 文件组织

```
skills/politics/
├── politics-framework-coach/{SKILL.md, references/{politics-framework-building-guide.md, politics-module-map.md}}
├── politics-concept-explainer/{SKILL.md, references/politics-concept-analogy-bank.md}
├── politics-application-coach/{SKILL.md, references/{politics-4step-statemachine.md, politics-socrates-guide.md, politics-question-types.md, politics-current-affairs-linking.md}}
├── politics-value-reasoning/{SKILL.md, references/politics-value-reasoning-framework.md}
└── politics-error-dna/{SKILL.md, references/{politics-error-dimension-table.md, politics-concept-confusion-map.md, politics-anxiety-handling.md}}
```

- kebab-case；references 不跨目录引用；frontmatter `references:` 用 `references/xxx.md`。

---

## 7. 政治超纲风险（验证重点）

- **政治学/哲学学术理论深度**：高中要求基础理解（如国家本质、民主本质），不深入学术争议（国家起源学说流派、民主理论学派）。初中道德与法治降级为生活化。
- **唯物论/认识论/辩证法/历史唯物主义**：高中哲学必修；初中不系统学哲学，降级为生活化道理。
- **时政深度**：高中联系重大时政（如重要会议、重大政策）；初中基础联系。
- **价值判断**：只教"如何构建价值论证"，不教"正确立场是什么"。

---

## 8. 生成顺序与质量验收清单

**顺序**：framework-coach → concept-explainer → application-coach → value-reasoning → error-dna。

**每 SKILL 自检**：13 段完整、≥1 决策树/状态机、≥2 实质表格、学习科学命中≥5、各学段适配段必须有、禁止行为含价值观红线、references 不跨目录、对比式定位、小龙虾彩蛋。**value-reasoning 必须显式写出"只练论证不评立场"红线段落**。

**完成后**：输出文件清单 + 每 SKILL 一句话自评。
