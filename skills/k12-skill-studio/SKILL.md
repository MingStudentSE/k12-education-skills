---
name: k12-skill-studio
description: 面向仓库维护者创建、迁移、审查和评测 K12 Product Module 与内部 playbook。用户要求新增或优化 K12 教学流程、把旧 Skill 收进 playbook、检查触发/渐进式披露/安全边界、设计行为测试、运行 S1–S8 质量评分、跨模型盲测或发布前回归时使用。不是学生日常答疑入口，不创建学习档案，也不替代官方通用 skill-creator。
---

# K12 Skill Studio

维护四 Product Module 架构。优先深化现有 module；只有出现新的真实 seam 时才允许新增 Product Module。

## 任务选择

- **创建或改进教学 playbook**：读取 `references/playbooks/studio/educational-skill-creator/playbook.md` 和必要 references。
- **创建或修改 Product Module**：先读仓库 `CONTEXT.md` 与 ADR，再使用当前环境官方 `skill-creator`；不得重新建立一方法一 Skill。
- **质量评分、跨模型盲测、回归**：读取 `references/playbooks/studio/system-quality-scoring/playbook.md`、rubric、协议、场景和 Schema。
- **迁移旧 Skill**：保留 source mapping、行为用例和 Schema；先迁移验证，后删除旧 interface。

## Playbook 创建流程

1. 定义学习对象、具体场景、输入材料、成功标准和不触发反例。
2. 选择 owner Product Module；教学方法通常属于 `k12-learning`，副作用属于 `k12-automation`，Wiki 规则属于 `llm-wiki`。
3. 先搜索现有 playbook；能扩展现有实现时不新建平行目录。
4. 把流程、决策规则写入 `playbook.md`；长理论、Schema、例子分别放 references/schemas/assets。涉及结构化接口时，先把每个输出归为 `persisted`、`derived` 或 `report-only`：只有真实持久化字段进入状态/档案 Schema；派生视图和仅报告文本如需结构校验，只能进入独立的只读 output/report Schema，并声明非持久化语义。
5. 在 Capability Map 中增加 mode 或 intents，而不是新增平台 Skill。
6. 添加具体材料、相邻冲突、信息不足、授权撤回和红线用例。
7. 运行 module 级结构、行为、安全和来源覆盖测试。

## Product Module deletion test

提出新 Product Module 前回答：

1. 删除它会集中 complexity，还是只把实现移入现有 module？
2. 是否有两个以上真实 adapter 证明新 seam？
3. interface 是否显著小于 implementation，具备足够 depth？
4. 学习者是否必须看见这个 interface？

任一答案不成立时，保留为内部 playbook 或 adapter。

## 质量评分

1. 固定 rubric、场景集、被测版本和 `live|dry_run`。
2. EUT 跑场景产出 trace，不自评。
3. 脱盲后交叉裁判；每个分数引用 trace 证据。
4. D6/D7 红线先判封顶，再计算总分。
5. 同时写机读 scorecard 与人读 REPORT；dry-run、同模型自评、非盲测和覆盖缺口必须显式声明。

## 安全与发布

- 不把真实学生数据、API key 或私有端点作为 fixture。
- 新增持久化字段必须有长度、枚举、格式和高敏禁止项；授权状态与数据块用条件 Schema 绑定。
- `derived` 只能由已声明的输入实时计算，`report-only` 只服务本次报告；两者不得冒充状态/档案 Schema 字段、写入持久状态或被下游当作已存事实。独立 output/report Schema 可以校验它们，但必须标为只读/非持久化并写清输入、规则或失效边界。
- 删除旧 interface、发布、上传或覆盖归属不明内容前必须确认；本仓库已由 ADR-0001 授权本次 63→4 迁移。
- 未通过官方 `quick_validate.py`、仓库质量门和行为回归时，不声称 module 可发布。

## 资源

- `references/playbooks/studio/educational-skill-creator/`：教育流程设计、检查表与模板。
- `references/playbooks/studio/system-quality-scoring/`：S1–S8、8 维 rubric、盲测协议、报告模板和 scorecard Schema。
- 仓库 `CONTEXT.md`：Product Module、Playbook、Learning State、Adapter、Capability Map 定义。
- 仓库 `docs/adr/`：不可重新争论的架构决策。
