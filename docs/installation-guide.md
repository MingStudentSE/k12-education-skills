# 安装与升级指南

> 当前版本：**V3.0**

## 安装矩阵

| 场景 | 安装 |
|---|---|
| 日常答疑、错题、计划、复盘 | `k12-learning` |
| Markdown/Obsidian 知识库 | 加 `llm-wiki` |
| 提醒、OCR、夜跑、看板 | 加 `k12-automation` |
| 开发和评测 playbook | 加 `k12-skill-studio` |

## 普通用户安装

请帮我安装 [k12-learning](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning) 和 [llm-wiki](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki)。

AI 自行处理安装路径和具体操作。需要其他模块时使用 [AI 安装提示词](ai-install-prompt.md)。安装完成后，拿出一份近期课本、作业、试卷、错题或作文材料，要求系统先做 3–5 分钟快速测评、生成会话内初版学习 DNA，再立即进入一个真实学习任务；不要做全面测评，跨会话保存前另行确认。

## 从 63 Skill 版本升级

1. 先备份旧安装目录和任何真实学生数据。
2. 安装四模块版本到新目录。
3. 验证常用的学科、错题、DNA、费曼和四步法场景。
4. 自动化用户把数据根保留原位，只把脚本入口改为 `k12-automation/scripts/nightline/`。
5. 确认无旧调用后，移除旧的平级 Skill 目录，避免宿主继续展示 63 个入口。

旧名到新位置的精确映射见 [`legacy-skill-mapping.json`](legacy-skill-mapping.json)。旧 `educational-llm-wiki` 不再安装；使用新的 `llm-wiki`，并按其迁移流程增量适配已有 vault。

## 升级自动化运行时

模块更新时不要覆盖本地：

- `config.json`
- `students/`
- `logs/`
- `dashboard.html`
- 授权记录

脚本与数据根分离。建议先在 `K12_MOCK_LLM=1` 下回归，再切换真实模型。

## 卸载

删除模块目录只会卸载能力，不代表删除外部数据。卸载 `k12-automation` 前，另行确认是否导出或删除学生数据、日志、看板和授权记录；卸载 `llm-wiki` 不应自动删除目标 Wiki。
