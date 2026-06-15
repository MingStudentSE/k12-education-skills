# 仓库贡献指南

## 项目结构与模块组织

本仓库维护 K12 教育 AI Skill 包及其配套文档。

- `skills/` 存放可独立安装的 Skill。每个 Skill 使用独立目录，通常包含 `SKILL.md`、可选的 `references/`、可选的 `schemas/` 和 `test-prompts.json`。
- `skills/general/` 存放通用学习系统 Skill；`skills/chinese/`、`skills/math/`、`skills/english/`、`skills/physics/` 存放学科专项 Skill。
- `docs/` 存放架构、安装、Obsidian 接入和维护说明。
- `references/` 存放项目级理论笔记和原始资料。理论资料遵循“一个理论一个笔记”，例如 `references/主动回忆.md`。

## 构建、测试与开发命令

本仓库没有应用构建步骤。提交前优先运行以下检查：

```bash
find skills -name SKILL.md | wc -l
find skills/general -mindepth 1 -maxdepth 1 -type d | wc -l
rg "old-name-or-path" README.md docs references skills
```

这些命令用于确认 Skill 数量、目录改名结果和旧路径残留。

## 写作风格与命名约定

仓库主要由 Markdown 文件组成。标题要清晰，列表要简洁，示例要能直接使用。Skill 目录使用小写 kebab-case，例如 `skills/general/learning-plan/`。根目录 `references/` 下的理论笔记使用中文文件名，并保持“一个理论一个笔记”。单个 Skill 不得运行时依赖根目录 `references/`；需要随包使用的理论材料必须复制到该 Skill 自己的 `references/` 目录。

## 测试指南

每个 Skill 应包含 `test-prompts.json`，用于保存真实可回归的测试提示。修改 Skill 时，检查 frontmatter、`references:` 声明和被链接文件。涉及数量、目录或范围变化时，确认当前仍为 35 个 Skill、15 个通用 Skill，除非本次变更明确调整范围。

## 提交与 PR 规范

近期提交使用类似 Conventional Commits 的前缀，例如 `feat:`、`docs:`、`chore:`。提交应聚焦单一目的，并说明变更价值。PR 应概述修改的 Skill 或文档、列出已运行的验证命令，并说明剩余风险或刻意未改的范围。

## 安全与配置提示

遵循 `SECURITY_BASELINE.md`：未经用户明确同意，不建立长期记录、不发送提醒、不跨 Skill 共享。保持单个 Skill 的独立安装边界；除非明确需要，不新增外部依赖。
