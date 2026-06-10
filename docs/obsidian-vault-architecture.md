# Obsidian 学习仓库架构

本文档定义这些 SKILL 在 Obsidian 笔记仓库中的推荐分层。  
默认参考 LLM Wiki 的三层架构：`100-Raw / 200-Wiki / 300-Output`。

---

## 核心原则

不要把学习仓库做成普通文件夹分类，也不要让 33 个 SKILL 随机写入笔记。  
Obsidian 仓库应被视为一个持续运行的学习系统：

```text
100-Raw     = 原始学习证据
200-Wiki    = 编译后的学习资产
300-Output  = 可查看、可复盘、可交付的成果
999-Assets  = 附件、图片、导出、备份
AGENTS.md   = 项目级本地宪法与 skill 调用规则
```

### 三层边界

- `100-Raw`：学生、家长、老师或外部系统产生的原始记录。默认不改写。
- `200-Wiki`：AI 根据原始记录编译出的知识结构、错因模式、方法、模板和索引。
- `300-Output`：计划、周报、月报、复习包、阶段报告等可直接使用的结果。

---

## 推荐目录

```text
Obsidian-Learning-Vault/
├── AGENTS.md
├── 100-Raw/
│   ├── 110-Learning-Campaign/
│   │   ├── 111-Daily-Learning/
│   │   ├── 112-Weekly-Seasons/
│   │   └── 113-Exam-Arcs/
│   ├── 120-Traces/
│   │   ├── 121-IM-Reminders/
│   │   ├── 122-Class-Notes/
│   │   └── 123-Question-Captures/
│   └── 130-Materials/
│       ├── 131-Books/
│       ├── 132-Articles/
│       ├── 133-Papers/
│       └── 134-Problem-Sets/
├── 200-Wiki/
│   ├── 学习总控台.md
│   ├── 210-Learning-Memory/
│   ├── 220-Subject-Codex/
│   │   ├── Chinese/
│   │   ├── Math/
│   │   ├── English/
│   │   └── Physics/
│   ├── 230-Error-Codex/
│   │   ├── Wrong-Answer-Cards/
│   │   ├── Error-Patterns/
│   │   └── Breakthrough-Logs/
│   ├── 240-Methods-Forge/
│   │   ├── Templates/
│   │   ├── Rules/
│   │   ├── Bases/
│   │   └── Scripts/
│   └── 250-Atlas/
│       ├── Indexes/
│       └── Networks/
├── 300-Output/
│   ├── 310-Student-Dashboard/
│   ├── 320-Plans/
│   ├── 330-Reports/
│   ├── 340-Review-Packs/
│   └── 399-Generated/
└── 999-Assets/
    ├── attachments/
    ├── exports/
    └── backups/
```

---

## 层级放置规则

### 100-Raw：原始学习证据

放还没有被 AI 编译的原始材料：

- 每日学习记录
- 拍题、错题照片、原始答案
- 课堂笔记原图或原始摘录
- IM 提醒回执
- 书、文章、PDF、试卷、题集
- 学生口述、家长反馈、老师反馈原文

对应 SKILL：

- `correction-notebook` 读取错题原始证据
- `im-reminder` 读取提醒回执
- `cornell-notes` 读取课堂笔记原始材料
- `science-solving-four-steps` 读取单题原始题面和学生尝试

### 200-Wiki：编译后的学习资产

放 AI 维护的结构化知识层：

- 学习画像字段定义、成长指标、画像生成规则
- 学科概念页、方法页、案例页
- 错因模式、顽固弱项、突破记录
- 学习区规则、解题四步法、费曼追问模板
- Obsidian Bases、索引、图谱

对应 SKILL：

- `learning-dna` 的字段定义、画像生成规则和指标解释写入 `210-Learning-Memory/` 或 `240-Methods-Forge/`
- `math-error-dna`、`physics-error-dna` 写入 `230-Error-Codex/`
- `science-solving-four-steps` 可沉淀方法到 `220-Subject-Codex/` 或 `230-Error-Codex/`
- `cornell-notes` 写入 `220-Subject-Codex/`
- `skill-coordinator` 维护 `学习总控台.md` 和 `250-Atlas/`

### 300-Output：可使用成果

放已经可以直接查看、复盘、交付的结果：

- 30 天学习计划
- 学习画像、长期偏好、成长图谱
- 每周学习复盘
- 月度全景报告
- 考前复习包
- 家庭看板
- 阶段性成长报告

对应 SKILL：

- `learning-dna` 写入 `310-Student-Dashboard/`
- `learning-plan` 写入 `320-Plans/`
- `weekly-review` 写入 `330-Reports/`
- `skill-coordinator` 写入月报或系统健康检查
- 学科专项 SKILL 可生成 `340-Review-Packs/`

---

## AGENTS.md 的职责

`AGENTS.md` 是 Obsidian 仓库的项目级总入口，不是一个新 SKILL。

它负责：

- 说明当前 vault 是什么
- 规定进入 vault 后先读哪些文件
- 定义三层边界
- 定义 SKILL 路由
- 定义写入位置
- 定义安全和授权规则

具体可直接使用 [AGENTS.k12-learning-vault.template.md](AGENTS.k12-learning-vault.template.md) 作为模板。

### 与 SKILL 本体解耦

SKILL 本体应保持宿主无关，只描述“何时调用、如何处理、产出什么、如何授权”。  
Obsidian 的目录结构、读写路径和项目级路由规则只放在 vault 根目录的 `AGENTS.md` 中。

这样同一个 SKILL 可以安装到不同环境：在普通对话中只输出结果，在 Obsidian vault 中由 `AGENTS.md` 决定结果写到哪里。

---

## 默认调用关系

| 用户请求 | 主 SKILL | 默认读写位置 |
|----------|----------|--------------|
| 处理一道错题 | `correction-notebook` | 读 `100-Raw/120-Traces/123-Question-Captures/`，写 `230-Error-Codex/` |
| 学透一道理科题 | `science-solving-four-steps` | 读原始题面，写题目拆解和变式验证 |
| 我懂了但讲不清 | `feynman-learning` | 写理解验证记录到 `220-Subject-Codex/` |
| 整理课堂笔记 | `cornell-notes` | 读 `122-Class-Notes/`，写 `220-Subject-Codex/` |
| 制定计划 | `learning-plan` | 写 `300-Output/320-Plans/` |
| 周复盘 | `weekly-review` | 写 `300-Output/330-Reports/` |
| 系统联动/月报 | `skill-coordinator` | 读必要摘要，写 `学习总控台.md` 或 `330-Reports/` |

---

## 维护红线

- 不把 AI 生成内容直接覆盖原始记录。
- 不把计划、报告、复习包放进 `200-Wiki` 当知识页。
- 不把未处理的拍题、PDF、摘录放进 `200-Wiki`。
- 不在根目录随手新建生成型文件夹。
- 不让单个 SKILL 依赖仓库根目录共享 `references/`。
- 不绕过 `AGENTS.md` 的写入规则。
