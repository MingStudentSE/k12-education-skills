# K12 Education Skills 领域模型

## 核心术语

### Product Module

平台可发现、可独立安装的顶层 Skill。仓库只保留四个 Product Module；用户不接触内部 playbook 名称。

### Playbook

Product Module 内按需读取的教学方法、任务流程或学科规则。Playbook 不是 Skill，不含 `SKILL.md`，不会参与平台路由。

### Learning State

需要授权才能跨会话保存的学习数据，包括学习画像、错题状态、计划状态和复盘证据。Learning State 的语义与 Schema 归 `k12-learning` 所有。

首次快速测评生成的会话内初版学习 DNA 不是持久化 Learning State；只有用户明确同意跨会话保存后，才进入 Learning State。

### Adapter

跨越副作用 seam 的实现。提醒调度、夜间模型调用、文件写入和知识库沉淀都必须经 adapter，并在执行前通过对应授权门。

### Capability Map

`k12-learning` 内部从自然语言意图到 playbook 的机读映射。它只选择内部实现，不选择其他学习 Skill。

## 四个 Product Module

| Product Module | 领域职责 | 不负责 |
|---|---|---|
| `k12-learning` | K12 intake、学科答疑、错因、训练、理解验证、计划、专注、探索和复盘 | 真实提醒、夜间批处理、通用 Wiki 维护、Skill 开发 |
| `llm-wiki` | 四层 Markdown Wiki 的初始化、入库、查询、索引、日志、归档和 lint | 判断 K12 教学方法、推断学习画像、自动读取学生历史 |
| `k12-automation` | 明确授权后的提醒、夜间错题批处理、OCR、看板与撤权运行控制 | 教学判断、默认建档、默认外传 |
| `k12-skill-studio` | K12 Skill/Playbook 创建、审查、行为评分和回归维护 | 学生日常学习任务 |

## 不可变约束

1. `skills/` 下恰好四个可发现的 `SKILL.md`。
2. 学科与通用方法只作为内部 playbook 存在，不再创建一方法一 Skill 的浅 module。
3. `k12-learning` 是唯一日常学习 interface；内部一次可组合多个 playbook。
4. `llm-wiki` 是唯一 Wiki 规则来源；K12 只经授权 adapter 传递最小必要内容。
5. `k12-automation` 是外部副作用 seam；未获授权时只返回计划，不执行提醒、外传或长期写入。
6. `k12-skill-studio` 只进入维护者安装面，不出现在学生默认安装清单。
7. 删除旧 Skill interface 前，必须把其方法、Schema 与行为用例迁入新 module，并保留来源映射。
