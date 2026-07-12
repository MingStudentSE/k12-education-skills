# K12 教育系统理论基础总表

> 本文件记录当前四 Product Module 体系已经使用的主要学习理论、方法论和设计依据。
> 详细理论拆成单独笔记，入口见 `理论资料索引.md`。

## 总原则

本体系不是“让 AI 多讲一点”，而是让 AI 按学习发生的规律工作：

- 先保护注意力，再组织信息。
- 先让学生主动提取，再给解释和总结。
- 先暴露错误，再做修正和迁移。
- 先校准难度，再追求题量。
- 先建立复习节奏，再判断是否真正掌握。

## 理论与方法清单

| 理论/方法 | 核心意思 | 当前落地 module / playbook | 详见 |
|-----------|----------|----------------|------|
| 12 个认知原理 | 表达、记忆、注意、故事、情境、压力和分散练习共同影响学生能否记住 | `k12-skill-studio` 的创建方法、`weekly-review` 与学习闭环 playbook | `大脑记忆与表达12个认知原理.md` |
| 学习区 | 学习应落在“大部分能处理，少部分会意外”的区域 | `learning-plan`、`weekly-review`、`science-solving-four-steps` | `学习区.md` |
| 85% 熟悉内容与 15% 意外挑战 | 任务设计应保持多数熟悉、少量新挑战 | `learning-plan`、`science-solving-four-steps` | `85-15意外挑战.md` |
| 主动回忆 | 主动从脑中提取比重读更能形成长期记忆 | `feynman-learning`、`cornell-notes`、`weekly-review` | `主动回忆.md` |
| 间隔重复 | 复习应分散到后续时间节点，抵抗遗忘 | `english-vocabulary-dna`、`learning-plan`；真实调度由 `k12-automation` 负责 | `间隔重复.md` |
| 交错练习 | 相似技能混合练习更能训练辨别和迁移 | `learning-plan`、`correction-notebook`、`math-gradient-trainer` | `交错练习.md` |
| 错误驱动学习 | 错误是心理模型与现实差距的证据 | `correction-notebook`、各学科 `*-error-dna` | `错误驱动学习.md` |
| 错因分类与错因 DNA | 把错误拆成可干预维度，并追踪长期模式 | `correction-notebook`、`math-error-dna`、`physics-error-dna` | `错因分类与错因DNA.md` |
| 费曼学习法 | 能用自己的话讲清楚、举例、解释原因并迁移 | `feynman-learning`、`interest-explorer` | `费曼学习法.md` |
| 康奈尔笔记法 | 固定版式、线索问题和底部总结帮助整理与回忆 | `cornell-notes` | `康奈尔笔记法.md` |
| 波利亚四步解题法 | 理解题目、拟定方案、执行方案、回顾迁移 | `science-solving-four-steps`、数学/物理解题类 playbook | `波利亚四步解题法.md` |
| 苏格拉底追问 | 用澄清、理由、证据、反例、边界追问促进深层思考 | `feynman-learning`、学科教练 | `苏格拉底追问.md` |
| 支架渐退 | 能力上来后逐步撤掉提示，挫败时降低支架 | `feynman-learning`、`science-solving-four-steps` | `支架渐退.md` |
| 最近发展区 | 学生在提示下可以完成的区域最适合教学介入 | `feynman-learning`、`learning-plan` | `最近发展区.md` |
| 元认知复盘 | 让学生看见自己的策略、卡点和下一步 | `weekly-review`、`learning-360-review`、`learning-dna` | `元认知复盘.md` |
| 自我调节学习 | 目标、计划、执行、监控、调整构成学习闭环 | `learning-plan`、`time-focus-coach`、`weekly-review` | `自我调节学习.md` |
| 反多任务 | 多任务本质是切换，会损失注意力和工作记忆 | `time-focus-coach`、`learning-plan` | `反多任务.md` |
| 时间块学习 | 用明确边界的时间块承载执行 | `time-focus-coach`、`learning-plan` | `时间块学习.md` |
| 番茄工作法 | 用有限专注块降低启动阻力，配合休息恢复注意力 | `time-focus-coach` | `番茄工作法.md` |
| 情境依赖学习 | 学习环境、状态、情绪会影响表现和记忆 | `time-focus-coach`、`correction-notebook` | `情境依赖学习.md` |
| 项目式学习 | 围绕真实问题探索、产出和复盘，提高意义感 | `cross-subject-detective` | `项目式学习.md` |
| 跨学科连接 | 把新知识接入旧知识、生活和其他学科网络 | `learning-dna`、`cross-subject-detective` | `跨学科连接.md` |
| 兴趣探索 | 兴趣需要通过真实体验验证，而不是空想 | `interest-explorer` | `兴趣探索.md` |
| 概念图谱与新旧连接 | 新知识通过依赖、类比、对比和应用接入知识网络 | `learning-dna`、`cornell-notes`、概念解释类 playbook | `概念图谱与新旧连接.md` |

## 理论分层

### 1. 注意力层

- 反多任务
- 时间块学习
- 番茄工作法
- 情境依赖学习

主要负责：`time-focus-coach`、`learning-plan`。

### 2. 记忆层

- 主动回忆
- 间隔重复
- 康奈尔笔记法
- 情境依赖学习

主要负责：`feynman-learning`、`cornell-notes`、`weekly-review`；真实提醒由 `k12-automation` 负责。

### 3. 理解层

- 费曼学习法
- 苏格拉底追问
- 波利亚四步解题法
- 概念图谱与新旧连接

主要负责：`feynman-learning`、`science-solving-four-steps`、学科专项教练。

### 4. 迁移层

- 交错练习
- 85% 熟悉内容与 15% 意外挑战
- 跨学科连接
- 项目式学习

主要负责：`learning-plan`、`correction-notebook`、`cross-subject-detective`、学科专项教练。

### 5. 情绪与难度层

- 学习区
- 最近发展区
- 支架渐退

主要负责：`learning-plan`、`feynman-learning`、`weekly-review`；组合由 `k12-learning` 主流程决定。

## 维护要求

新增或大改 Product Module / playbook 时，必须在以下两处登记：

1. 如果引入新的理论基础，新增根目录 `references/理论名.md`，并更新 `理论资料索引.md`。
2. 如果某个 module 运行时需要该理论的具体规则，把精简版本放进该 module 自己的 `references/`。

禁止做法：

- 只在聊天中说明理论，不落文件。
- 多个理论合并成一个笔记。
- 让 Product Module 运行时依赖根目录 `references/`。
- 把理论名写进标签，但正文没有可执行规则。
