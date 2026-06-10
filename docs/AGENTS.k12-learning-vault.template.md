# AGENTS.md

本文件是当前 Obsidian 学习仓库的本地宪法。  
它规定 AI 进入本 vault 后应该先读什么、如何调用项目级 SKILL、以及结果应该写到哪里。

本 vault 不是普通 PKM，也不是单纯文件夹归档，而是一个基于三层架构的学生学习系统：

```text
100-Raw     = 原始学习证据
200-Wiki    = 编译后的学习资产
300-Output  = 可使用、可复盘、可交付的成果
```

---

## 0. 进门协议

只要任务涉及本仓库，先读取最小启动记忆包：

1. `200-Wiki/学习总控台.md`
2. `300-Output/310-Student-Dashboard/student.md`
3. `200-Wiki/240-Methods-Forge/Rules/学习系统运行规则.md`

然后按任务补读相关页面，不要默认全量读取学习档案、错题库、日记、周报或家庭反馈。

常见补读入口：

- 错题 / 错因：`200-Wiki/230-Error-Codex/`
- 学科知识：`200-Wiki/220-Subject-Codex/`
- 学习计划：`300-Output/320-Plans/`
- 周报 / 月报：`300-Output/330-Reports/`
- 原始拍题 / 课堂笔记：`100-Raw/120-Traces/`
- 书籍 / 文章 / 题集：`100-Raw/130-Materials/`
- SKILL 路由：项目级 skills 目录下对应 `SKILL.md`

如果当前用户指令与旧档案冲突：

1. 先尊重用户当前明确指令。
2. 指出旧档案中的冲突。
3. 必要时询问是否更新学习档案、规则页或学习总控台。

---

## 1. 三层边界

必须保护三层结构：

```text
100-Raw     = 原始证据层
200-Wiki    = 编译结构层
300-Output  = 输出成果层
```

### `100-Raw/`

原始证据层。  
这里主要放学生真实学习过程中的原始输入：拍题、原答案、课堂笔记、日学习记录、IM 提醒回执、PDF、文章、题集。

默认不要改写原始证据。必须修复时，保留原始版本并说明原因。

### `200-Wiki/`

编译结构层。  
这里主要由 AI 维护，用于学习档案、学科知识、错因模式、方法、模板、索引、规则和图谱。

### `300-Output/`

输出成果层。  
这里放计划、周报、月报、复习包、家庭看板、阶段报告等可直接查看和使用的成果。

---

## 2. 推荐目录

```text
100-Raw/
  110-Learning-Campaign/
    111-Daily-Learning/
    112-Weekly-Seasons/
    113-Exam-Arcs/
  120-Traces/
    121-IM-Reminders/
    122-Class-Notes/
    123-Question-Captures/
  130-Materials/
    131-Books/
    132-Articles/
    133-Papers/
    134-Problem-Sets/

200-Wiki/
  学习总控台.md
  210-Learning-Memory/
  220-Subject-Codex/
  230-Error-Codex/
  240-Methods-Forge/
  250-Atlas/

300-Output/
  310-Student-Dashboard/
  320-Plans/
  330-Reports/
  340-Review-Packs/
  399-Generated/

999-Assets/
```

---

## 3. Skill 路由

优先使用本 vault 的项目级 SKILL。  
不要让 33 个 SKILL 同时抢答；先根据当前笔记类型、用户意图和 frontmatter 判断主 SKILL。

| 场景 | 主 SKILL | 可联动 |
|------|----------|--------|
| 错题记录与初步错因 | `correction-notebook` | `math-error-dna`、`physics-error-dna` |
| 理科题学透 | `science-solving-four-steps` | `feynman-learning`、`cornell-notes` |
| 看懂但讲不清 | `feynman-learning` | `cornell-notes`、`learning-dna` |
| 课堂笔记整理 | `cornell-notes` | `learning-dna` |
| 30 天学习计划 | `learning-plan` | `time-focus-coach` |
| 每周复盘 | `weekly-review` | `learning-dna`、`correction-notebook` |
| 系统月报 / 健康检查 | `skill-coordinator` | 按需读取最小摘要 |
| 学科专项问题 | 对应学科 SKILL | 通用系统按需联动 |

---

## 4. 写入规则

- 原始题面、原始答案、课堂笔记原图：写入 `100-Raw/`
- 学习画像、长期偏好、成长图谱：写入 `300-Output/310-Student-Dashboard/`
- 学习画像字段定义、成长指标、生成规则：写入 `200-Wiki/210-Learning-Memory/` 或 `200-Wiki/240-Methods-Forge/`
- 学科概念、方法、案例：写入 `200-Wiki/220-Subject-Codex/`
- 错因模式、顽固弱项、突破记录：写入 `200-Wiki/230-Error-Codex/`
- 模板、规则、Bases、脚本：写入 `200-Wiki/240-Methods-Forge/`
- 索引、图谱、导航：写入 `200-Wiki/250-Atlas/`
- 学习计划：写入 `300-Output/320-Plans/`
- 周报、月报、阶段报告：写入 `300-Output/330-Reports/`
- 考前复习包：写入 `300-Output/340-Review-Packs/`
- 临时生成项目：写入 `300-Output/399-Generated/`

---

## 5. Frontmatter 标准

```yaml
---
type: wrong-answer | concept | method | plan | weekly-review | report
subject: chinese | math | english | physics | general
skill:
status: raw | compiled | needs-review | archived
created:
review_due:
source:
---
```

常用路由：

- `type: wrong-answer` → `correction-notebook`
- `type: concept` → 学科概念相关 SKILL
- `type: method` → `cornell-notes` 或对应方法 SKILL
- `type: plan` → `learning-plan`
- `type: weekly-review` → `weekly-review`

---

## 6. 安全规则

- 未经明确同意，不建立或更新长期学习档案。
- 未经明确同意，不发送提醒，不跨 SKILL 共享。
- 只读取完成当前任务所需的最小字段摘要。
- 不把 AI 生成内容覆盖学生原始记录。
- 涉及长期档案、提醒、复盘、家庭看板时，先说明写入位置。
- 用户可随时要求查看、更正、删除、暂停或取消共享。

---

## 7. 红线

不要做：

- 把原始错题直接改写成“整理后版本”并覆盖原文。
- 把计划、报告、复习包放进 `200-Wiki` 当知识页。
- 把还没处理的 PDF、拍题、摘录放进 `200-Wiki`。
- 在根目录创建临时输出文件夹。
- 跳过 `AGENTS.md` 的路由和写入规则。
- 让 AI 直接给答案而不保留学生思考过程。

优先做：

- 保留证据。
- 小步编译。
- 明确写入位置。
- 先判断学习区，再安排训练。
- 用测验、讲解、变式和间隔复测确认真正掌握。
