---
name: educational-skill-creator
display_name: 🛠️ 教育 Playbook 设计治理
version: 3.0.1
author: K12 教育 AI 辅导系统
category: Studio/维护治理
tags: [教育playbook, Product Module, 四层结构, 资料使用, 学习流程, 学习科学, 行为回归]
description: >
  面向仓库维护者创建或改进 K12 Product Module 与内部 playbook。用于把教学需求写成可测试流程、
  设计触发与反例、补齐学习科学和授权边界、迁移 V2 旧入口、生成行为用例并做发布前检查。
  学生只想调整自己的学习方式或获得个性化训练时不使用本方法，留在 k12-learning 内完成。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/skill-templates-library.md
  - references/creator-operating-manual.md
  - references/creator-checklists.md
---

> **内部 playbook**：本文件不是平台可发现 interface；只供 `k12-skill-studio` 的维护任务按需读取。

# 🛠️ 教育 Playbook 创建方法

> 一句话定位：帮助维护者把学习需求转成可测试、可迭代、守隐私边界的 Product Module 或内部 playbook。

## 触发边界

- 触发：维护者要新增/优化内部 playbook、修改 Product Module、迁移 V2 旧入口、设计行为测试或审查教育流程。
- 不触发：学生只想得到专属训练、调整讲解方式或投喂当前材料；这些请求留在 `k12-learning`，不创建安装包。
- 最小输入：学习痛点、适用场景、输入输出、已有流程、成功标准和 owner Product Module。
- 新增公开 Product Module 前必须先读 `CONTEXT.md` 与 ADR，并通过 deletion test。

## 流程骨架

1. **定需求**：把维护请求落到学习对象、场景、输入、输出、反例、边界和成功标准。
2. **定 owner**：教学方法进入 `k12-learning`；副作用进入 `k12-automation`；Wiki 规则进入 `llm-wiki`；治理进入 Studio。
3. **嵌学习科学**：至少命中主动回忆、错误反馈、分散复习、交错练习、学习区中的关键项。
4. **组织资源**：流程写入 `playbook.md`，长理论、Schema 与样例按需放 references/schemas/assets；内部 playbook 不含嵌套 `SKILL.md`。结构化输出先区分持久化字段、派生视图和仅报告文本：只有真实持久化字段进入状态/档案 Schema；后两类如需机器校验，进入独立只读 output/report Schema，并明确不得回写。
5. **测试迭代**：用 happy path、信息不足、越界请求、失败案例跑测；3-5 次真实使用后改一轮。
6. **交付下一步**：输出实现、Capability Map 变更、测试 prompt、来源映射、验证结果和剩余风险。

## 核心规则

- 新 playbook 每轮只推进一个学习动作，先让学生讲/写/预测，再给提示或总结。
- 错题、作文、口语、实验、计划失败等场景必须有“错误—修正—再犯预警—变式验证”。
- 训练不能只做同类重复，要安排易混题、换场景复测和后续复习。
- 记录类方法的字段顺序稳定；概念类方法优先使用图、表、关系链或短故事。
- 接口只承诺 Schema 中真实存在的持久化字段；派生视图写明计算输入与失效条件，仅报告文本写明不落库，避免把生成内容伪装成状态。
- 难度失配时调参：太易加迁移/变式，太难拆子问题/补前置/降一级。

## 失败红线

- 不臆造学生水平、历史记录、已上传资料或长期数据。
- 不默认写入档案、记忆或提醒；未授权时只输出本轮结果。
- 不把仓库级安全文件或理论文件当作发布包运行依赖；主流程必须自包含。
- 不鼓励上传身份证、账号、成绩单全量原件等无关敏感信息；资料投喂坚持最小必要。
- 不用“万能助教”式角色；职责过宽时先收窄场景再写流程。
- 不把模板当最终成品；模板只能作为安全审查素材，必须按当前 Product Module 契约改造并测试。

## 参考资源

- `references/creator-checklists.md`：创建前输入、四层结构、学习科学、五步流程、诊断指标和误区修复清单。
- `references/creator-operating-manual.md`：四模块冻结、owner、学习科学、状态 seam、测试和迭代的完整说明。
- `references/skill-templates-library.md`：七个历史场景模板；使用前必须应用文件顶部的 V3 授权与副作用规则。
