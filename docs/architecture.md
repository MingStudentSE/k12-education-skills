# 🏛️ 系统架构与方法论

本文档描述当前仓库保留的 **学生端 33 个 SKILL**：它们如何分层、如何协作，以及背后的方法论依据。

---

## 🗂️ 仓库结构

```text
skills/
├── general/   # 通用学习系统与成长层
├── chinese/   # 语文学科专项
├── math/      # 数学学科专项
├── english/   # 英语学科专项
└── physics/   # 物理学科专项
```

如果这些 SKILL 作为 Obsidian 项目级 SKILL 使用，笔记仓库建议采用 LLM Wiki 风格三层架构：

```text
100-Raw     # 原始学习证据
200-Wiki    # 编译后的学习资产
300-Output  # 可查看、可复盘、可交付的成果
```

详细说明见 [Obsidian 学习仓库架构](obsidian-vault-architecture.md)，项目级入口模板见 [AGENTS.k12-learning-vault.template.md](AGENTS.k12-learning-vault.template.md)。

### 数量总览

| 类别 | 数量 |
|------|------|
| `skills/general/` | 13 |
| `skills/chinese/` | 5 |
| `skills/math/` | 5 |
| `skills/english/` | 5 |
| `skills/physics/` | 5 |
| **总计** | **33** |

### 单个 SKILL 可安装边界

平台安装通常以单个 SKILL 目录为单位，因此每个 SKILL 必须自包含：

```text
skill-folder/
├── SKILL.md
├── references/   # 本 SKILL 运行所需参考材料
└── schemas/      # 本 SKILL 运行所需数据结构
```

维护规则：

- `SKILL.md` 中声明的 `references:` 必须指向本目录内文件，例如 `references/foo.md`
- 不允许运行时依赖 `../../../references/...` 这类仓库根目录路径
- 可复用方法论如果被多个 SKILL 使用，应复制为各自目录下的精简版本，而不是放成根目录共享依赖
- 根目录 `references/` 只可作为原始资料或项目级研究材料存放，不作为单个 SKILL 安装时的运行依赖

---

## 📚 完整 SKILL 清单

### 一、通用学习系统（13 个）

| # | SKILL 名称 | 文件夹 | 版本 | 核心功能 |
|---|-----------|-------|------|---------|
| 1 | 🧬 学习DNA | `skills/general/learning-dna/` | v1.1+ | 长期档案、成长图谱、学习风格、兴趣接口 |
| 2 | ❌ 智能错题本 | `skills/general/correction-notebook/` | v1.1+ | 错因分析、弱项预警、同类验证、学期报告 |
| 3 | ⏰ IM智能提醒 | `skills/general/im-reminder/` | v1.1+ | 复习提醒、计划提醒、探索提醒、每日确认 |
| 4 | 🎓 费曼学习法 | `skills/general/feynman-learning/` | v1.1+ | 五跳追问、理解验证、挑战者模式 |
| 5 | 📊 每周学习复盘 | `skills/general/weekly-review/` | v1.1+ | 六模块周报、学习区检查、成长曲线、复盘追问 |
| 6 | 🛠️ SKILL创建教练 | `skills/general/skill-creator/` | v1.0 | 帮学生把个人需求抽象成可复用工具 |
| 7 | 📝 康奈尔笔记 | `skills/general/cornell-notes/` | v1.0 | 笔记提炼、自测问题、知识沉淀 |
| 8 | 🔗 五SKILL联动协调器 | `skills/general/skill-coordinator/` | v1.1+ | 联动判断、学习区校准、全景月报、系统健康检查 |
| 9 | 📅 30天学习计划制定师 | `skills/general/learning-plan/` | v1.0+ | DNA 驱动计划、学习区校准、执行拆解、家庭看板 |
| 10 | ⏱️ 时间与专注力教练 | `skills/general/time-focus-coach/` | v1.0 | 时间销行账、黄金时段、智能番茄钟 |
| 11 | 🔭 跨学科侦探周 | `skills/general/cross-subject-detective/` | v1.0 | 项目式探索、跨科联结、侦探周流程 |
| 12 | ☕ 兴趣成长探索计划 | `skills/general/interest-explorer/` | v1.0 | 52 杯咖啡、兴趣验证、兴趣DNA |
| 13 | 🧩 理科解题四步法 | `skills/general/science-solving-four-steps/` | v1.0 | 波利亚四步解题、题目结构拆解、变式迁移、间隔复测 |

### 二、语文学科专项（5 个）

| # | SKILL 名称 | 文件夹 | 核心功能 |
|---|-----------|-------|---------|
| 14 | 语文写作教练 | `skills/chinese/chinese-writing-coach/` | 5步流程、风格DNA、写作追问 |
| 15 | 阅读理解拆解师 | `skills/chinese/chinese-reading-decoder/` | 错因识别、出题人视角、答题结构 |
| 16 | 文言文复活计划 | `skills/chinese/chinese-classical-revival/` | 角色扮演、三级跳、背诵与理解 |
| 17 | 语文素材库2.0 | `skills/chinese/chinese-material-library/` | 素材积累、自动标签、写作前调用 |
| 18 | 语病追踪档案 | `skills/chinese/chinese-grammar-tracker/` | 六类语病识别、顽固档案、预警 |

### 三、数学学科专项（5 个）

| # | SKILL 名称 | 文件夹 | 核心功能 |
|---|-----------|-------|---------|
| 19 | 数学解题教练 | `skills/math/math-problem-solving-coach/` | 四步拍照法、CLAW5 模板、五问链 |
| 20 | 数学错误DNA | `skills/math/math-error-dna/` | 错误分类、顽固追踪、月度图谱 |
| 21 | 数学概念解释器 | `skills/math/math-concept-explainer/` | 生活类比、几何直觉、概念重建 |
| 22 | 应用题建模教练 | `skills/math/math-word-problem-coach/` | 数量关系提取、五大题型建模 |
| 23 | 思维梯度训练师 | `skills/math/math-gradient-trainer/` | 天花板测定、进阶序列、成长日记 |

### 四、英语学科专项（5 个）

| # | SKILL 名称 | 文件夹 | 核心功能 |
|---|-----------|-------|---------|
| 24 | 英语口语陪练 | `skills/english/english-speaking-coach/` | 热身、角色扮演、口语成长轨迹 |
| 25 | 智能词汇DNA系统 | `skills/english/english-vocabulary-dna/` | 词汇入库、遗忘追踪、主题雷达 |
| 26 | 英语语法突破教练 | `skills/english/english-grammar-coach/` | 语法图谱、追问、错误模式分析 |
| 27 | 个性化英语听力训练师 | `skills/english/english-listening-trainer/` | DNA 驱动听力、四步训练、卡壳追问 |
| 28 | 英语写作进化教练 | `skills/english/english-writing-coach/` | 三维批改、句式升级、写作档案 |

### 五、物理学科专项（5 个）

| # | SKILL 名称 | 文件夹 | 核心功能 |
|---|-----------|-------|---------|
| 29 | 物理解题教练 | `skills/physics/physics-problem-coach/` | 四步法、图景建立、物理追问 |
| 30 | 物理错误DNA | `skills/physics/physics-error-dna/` | 五维错误分类、弱项追踪、焦虑处理 |
| 31 | 物理概念直觉器 | `skills/physics/physics-concept-intuition/` | 类比、实验想象、公式意义还原 |
| 32 | 物理建模教练 | `skills/physics/physics-modeling-coach/` | 建模三步法、核心模型迁移 |
| 33 | 物理实验思维教练 | `skills/physics/physics-lab-coach/` | 实验方法、数据分析、实验评价 |

---

## 🔄 系统协作架构

### 1. 核心学习飞轮

```text
错题记录
   ↓
错因识别
   ↓
单题掌握（理科题目拆解 / 变式）
   ↓
理解验证（费曼）
   ↓
知识沉淀（笔记 / DNA）
   ↓
复习提醒
   ↓
每周复盘
```

这条飞轮对应的关键角色：

- `学习DNA`：提供长期个性化背景
- `智能错题本`：识别错误根因
- `理科解题四步法`：把一道理科题拆到可解释、可迁移、可复测
- `费曼学习法`：验证是否真正掌握
- `康奈尔笔记`：把问题沉淀成可复用知识
- `IM智能提醒`：负责回访和节奏
- `每周学习复盘`：把零散行为整合成趋势判断

### 2. 学习系统联动扩展

在核心飞轮之外，系统还把“这道题是否学透”和“学会了但做不到”单独拆出来处理：

```text
错题 / 盲区
   ↓
理科题目掌握：是否能拆结构、讲入口、做变式
   ↓
费曼验证是否真懂
   ↓
若懂但总做不到：
   ├── 学习计划：任务是否被拆成行动
   └── 时间专注：行动是否真正落地
```

所以 `五SKILL联动协调器` 回答的是一组不同问题：

- 错题本：哪里错
- 理科解题四步法：一道题是否真的学透
- 费曼：到底懂没懂
- 康奈尔笔记：有没有形成沉淀
- 学习计划：有没有把目标拆成行动
- 时间与专注：有没有真正执行下来

### 3. 学习区校准

学生端通用层新增一个底层难度原则：只在学习区学习。

```text
熟悉区：几乎全会，新增学习量很低
学习区：大约85%熟悉内容 + 15%意外挑战
挫败区：大量不会，持续卡住，容易放弃或只等答案
```

落地方式：

- `30天学习计划制定师`：安排任务时标注熟悉区 / 学习区 / 挫败区
- `五SKILL联动协调器`：发现任务太易或太难时建议调参
- `每周学习复盘`：回看本周学习区命中情况
- `IM智能提醒`：用间隔学习支持复习和测验
- `康奈尔笔记` 与 `学习DNA`：沉淀新旧知识连接
- `理科解题四步法`：用单题变式、口头解释和间隔复测确认题目是否真正掌握

---

## 🧠 方法论依据

### 1. 学习区与85%规则

训练任务应尽量保持大约 85% 熟悉内容和 15% 意外挑战。太熟会停留在重复区，太难会进入挫败区，刚好有少量意外才更容易发生有效学习。

配套四法：

1. 安排间隔，不只突击
2. 用不同场景、不同方式学习同一内容
3. 经常测验，确认是否真的掌握
4. 把新知识和旧知识建立连接

### 2. 记忆飞轮

1. 记录首次错误
2. 在合适时间复习
3. 用同类题或变式题做回访
4. 找到固定错误模式
5. 在周报 / 月报里看见趋势

### 3. 费曼学习法

核心不是“听懂 AI 的解释”，而是“你能不能不用原话讲出来，并迁移到新场景”。

### 4. 波利亚解题法

理科题目掌握不是直接套答案，而是经历四个阶段：理解题目、拟定方案、执行方案、回顾迁移。`理科解题四步法` 把这四步落成可对话流程，并加入独立重做、口头解释、变式迁移和间隔复测。

### 5. AI 学习铁律

所有学生端 SKILL 都遵循同一个原则：

> 用 AI 辅助思考，不用 AI 替代思考。

### 6. 学科能力链

#### 语文能力链

写作表达升级 → 阅读拆题拿分 → 古诗文理解与背诵 → 素材长期积累 → 语言表达纠偏

#### 数学能力链

日常解题 → 错因沉淀 → 概念重建 → 应用题建模 → 天花板突破

#### 英语能力链

口语开口 → 词汇长期积累 → 语法突破 → 个性化听力 → 写作升级

#### 物理能力链

图景建立与解题 → 错误根因追踪 → 概念直觉重建 → 建模迁移 → 实验思维

---

## 🛡️ 权限与共享边界

学生端的所有联动都不是默认开启的，必须满足：

1. 当前任务明确需要
2. 用户已对相关档案或提醒授予授权
3. 只读取最小必要摘要
4. 用户可以随时要求“不记忆”“不提醒”“不要共享给其他SKILL”

这也是 [SECURITY_BASELINE.md](../SECURITY_BASELINE.md) 的核心原则。

---

## 📁 目录树

```text
skills/
├── general/
│   ├── learning-dna/
│   ├── correction-notebook/
│   ├── im-reminder/
│   ├── feynman-learning/
│   ├── weekly-review/
│   ├── skill-creator/
│   ├── cornell-notes/
│   ├── skill-coordinator/
│   ├── learning-plan/
│   ├── time-focus-coach/
│   ├── cross-subject-detective/
│   ├── interest-explorer/
│   └── science-solving-four-steps/
├── chinese/
│   ├── chinese-writing-coach/
│   ├── chinese-reading-decoder/
│   ├── chinese-classical-revival/
│   ├── chinese-material-library/
│   └── chinese-grammar-tracker/
├── math/
│   ├── math-problem-solving-coach/
│   ├── math-error-dna/
│   ├── math-concept-explainer/
│   ├── math-word-problem-coach/
│   └── math-gradient-trainer/
├── english/
│   ├── english-speaking-coach/
│   ├── english-vocabulary-dna/
│   ├── english-grammar-coach/
│   ├── english-listening-trainer/
│   └── english-writing-coach/
└── physics/
    ├── physics-problem-coach/
    ├── physics-error-dna/
    ├── physics-concept-intuition/
    ├── physics-modeling-coach/
    └── physics-lab-coach/
```

每个叶子目录都是独立安装单元；其 `references/` 和 `schemas/` 会随该 SKILL 一起打包。

---

## 📌 一句话总结

这 33 个 SKILL 不是 33 个孤立工具，而是一套围绕“记录错误、验证理解、形成沉淀、推动执行、看见成长”的学生学习系统。
