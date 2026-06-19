# 学段-科目-路由矩阵

本表是画像师的路由真值表。原则：按学段适配，不超纲；教材版本只做可选追问，不因未知版本阻断诊断。

## 小学

高年级为主：语文、数学、英语、科学常识。当前仓库学科专项大多面向初高中，小学使用时应降级表达、避免高中术语和过早抽象。

建议暖起：

- 语文表达/阅读：`chinese-writing-coach`、`chinese-reading-decoder`，但用小学文本和口语化任务。
- 数学基础：`math-concept-explainer`、`math-word-problem-coach`，避免高中模型。
- 学习方法：`feynman-learning`、`cornell-notes`、`learning-plan` 的轻量版。

## 初中

核心科目：语文、数学、英语、物理（初二起）、化学（初三起）、生物（初一初二）、道德与法治/政治、历史、地理（初一初二）、体育。整体以中考方向组织。

路由建议：

| 场景 | 建议暖起 |
|---|---|
| 初三全科冲刺 | `learning-plan`、`skill-coordinator`、`correction-notebook` |
| 初中数学错题 | `math-error-dna`、`math-problem-solving-coach`、`math-concept-explainer` |
| 初中物理/化学错题 | `physics-error-dna` 或 `chemistry-error-dna`，再接 `science-solving-four-steps` |
| 文综材料题 | `history-problem-coach`、`geography-problem-coach`、`politics-application-coach`，只练论证不评立场 |
| 生地结业或概念混乱 | `biology-concept-map-builder`、`geography-map-coach` |

## 高中

语文、数学、英语为必修底座，其他按选科组织。

### 老高考

- 文科：政史地为主，配语数英。
- 理科：物化生为主，配语数英。

### 新高考 3+1+2

- 语文、数学、英语必选。
- 物理/历史 2 选 1。
- 化学/生物/政治/地理 4 选 2。
- 常见组合：物化生、物化地、物化政、物生地、史政地、史生政、史地生等。常见不等于默认，必须追问确认。

路由建议：

| 方向 | 建议暖起 |
|---|---|
| 高中物理方向 | `physics-problem-coach`、`physics-error-dna`、`physics-concept-intuition`、`science-solving-four-steps` |
| 高中化学方向 | `chemistry-particle-modeler`、`chemistry-reaction-coach`、`chemistry-error-dna` |
| 高中生物方向 | `biology-structure-function-coach`、`biology-process-explainer`、`biology-error-dna` |
| 高中数学弱项 | `math-error-dna`、`math-problem-solving-coach`、`math-gradient-trainer` |
| 高中文综/史政地 | `history-timeline-coach`、`politics-value-reasoning`、`geography-region-analyzer`；坚持只练论证不评立场 |
| 选科犹豫 | `student-intake-profiler` 保持事实整理；必要时转 `interest-explorer` 和 `learning-plan`，不替学生下决定 |

## 教材版本追问

教材版本影响章节顺序、术语和例题风格。可选项：人教、北师大、苏教、沪教、外研、译林、地区版本、不确定。

追问方式：

```text
教材版本知道就填，不知道也没关系。我会先按通用课标和你给的题目证据来判断。
```
