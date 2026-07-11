# 安装与升级指南

> 当前版本：**V3.0**

## 安装矩阵

| 场景 | 安装 |
|---|---|
| 日常答疑、错题、计划、复盘 | `k12-learning` |
| Markdown/Obsidian 知识库 | 加 `llm-wiki` |
| 提醒、OCR、夜跑、看板 | 加 `k12-automation` |
| 开发和评测 playbook | 加 `k12-skill-studio` |

## Codex 安装

从仓库根目录执行：

```bash
mkdir -p ~/.codex/skills
cp -R skills/k12-learning ~/.codex/skills/
cp -R skills/llm-wiki ~/.codex/skills/
```

按需安装：

```bash
cp -R skills/k12-automation ~/.codex/skills/
cp -R skills/k12-skill-studio ~/.codex/skills/
```

目录必须整体复制，包括 `SKILL.md`、`references/`、`schemas/`、`scripts/` 和 `assets/`。不要把 `references/playbooks/` 中的目录复制到 Skill 根目录，否则会重新制造大量公开入口。

其他兼容宿主使用同样原则：把四个模块之一复制到宿主配置的 Skill 搜索目录。

## 安装后检查

```bash
find ~/.codex/skills/k12-learning ~/.codex/skills/llm-wiki -maxdepth 1 -name SKILL.md -print
test -f ~/.codex/skills/k12-learning/references/capability-map.json
```

刷新宿主后，用自然语言发一条学习请求。不要以“列出 58 个 playbook”作为可用性测试；正确行为是模块静默选取内部方法并解决任务。

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
