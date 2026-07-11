# ADR-0001：从 63 个浅 Skill 深化为四个 Product Module

- 状态：Accepted
- 日期：2026-07-11

## 背景

仓库原有 63 个平台可发现 Skill，其中 45 个学科 Skill 固定按每科 5 个切分，18 个通用 Skill 又把 intake、错题、理解验证、计划、专注、复盘、提醒、知识库和维护能力分别暴露。平台与用户必须在 63 个 interface 中选择；新增的总路由只隐藏了选择 complexity，没有消除它。

审查还发现 16 个 Skill 使用相同的触发、流程和红线模板，真实实现主要位于 references。按 deletion test，删除这些浅 interface 并把实现收进深 module 会集中 complexity、提高 locality，而不是把复杂度平移到另一批壳。

## 决策

仓库只保留四个可发现 Product Module：

1. `k12-learning`：唯一学生学习 interface；吸收 45 个学科 Skill 与 intake、DNA、错题、费曼、康奈尔、计划、专注、复盘、探索、四步解题和协调能力。
2. `llm-wiki`：采用用户提供的新四层 Wiki 实现，替换 `educational-llm-wiki`。
3. `k12-automation`：承接提醒与原 `engine/` 夜间运行能力，并将脚本收进 module 的 `scripts/nightline/`，形成明确副作用 seam。
4. `k12-skill-studio`：承接教育 Skill 创建与系统质量评分，只供维护者安装。

旧 Skill 的 `SKILL.md` 转为内部 `playbook.md`，references/schemas/assets 随所有者 module 迁移。旧测试合并到 module 级行为测试，保留 `source_skill` 追溯字段。迁移完成后删除旧 Skill interface，不提供仍会被平台发现的兼容壳。

## 结果

- 普通用户默认只安装 `k12-learning` 和 `llm-wiki`；需要真实提醒或夜跑时再安装 `k12-automation`。
- router 从跨 Skill 选择器变成 `k12-learning` 内部 Capability Map；一次任务可以组合多个 playbook，不再发生跨 Skill 循环。
- 四个 Product Module 是真实 seam：日常教学、通用持久知识、外部副作用、维护工程。
- 仓库质量门从“63/18 数量固定”改为“四 module + capability/test coverage 固定”。

## 迁移与回滚

迁移顺序为：建立四 module → 复制并验证 playbook/Schema/测试 → 切换质量门与文档 → 删除旧 interface → 全量回归。任何阶段失败都停止删除；已删除内容可从本 ADR 前的 Git 历史恢复，不在运行树保留第二套可发现 Skill。
