# 仓库贡献指南

## 项目结构与模块组织

本仓库维护 K12 教育 AI 的四个 Product Module 及其配套文档。

- `skills/k12-learning/` 是学生日常学习的统一入口，学科能力、学习 DNA、错题、侦探周和解题方法均作为内部 playbook 按需组合。
- `skills/llm-wiki/` 负责四层知识库的搭建、适配、编译与维护。
- `skills/k12-automation/` 负责提醒、夜间错题产线、OCR、看板和授权运行时。
- `skills/k12-skill-studio/` 仅面向维护者，负责创建 playbook、评测和系统质量治理。
- `skills/*/references/playbooks/` 存放内部 playbook。它们不是可安装 Skill，不得新增嵌套 `SKILL.md`。
- `skills/k12-learning/references/system-user-guide.md` 是能力介绍、首次使用与日常调用话术的单一来源；首页和快速开始只链接，不复制另一套能力菜单。
- `docs/` 存放架构、安装、Obsidian 接入和维护说明。
- `references/` 存放项目级理论笔记和原始资料。理论资料遵循“一个理论一个笔记”，例如 `references/主动回忆.md`。

## 构建、测试与开发命令

本仓库没有应用构建步骤。提交前优先运行以下检查：

```bash
find skills -name SKILL.md | wc -l
find skills -name playbook.md | wc -l
node pipeline/validate_modules.mjs
node pipeline/run_v3_route_regression.mjs --contract-only
python3 -m pip install -r pipeline/requirements.txt
python3 pipeline/validate_schemas.py
bash pipeline/review.sh all
```

这些命令用于确认四模块边界、内部能力映射、Schema 与自动化运行契约。

## 写作风格与命名约定

仓库主要由 Markdown 文件组成。标题要清晰，列表要简洁，示例要能直接使用。Product Module 与 playbook 目录均使用小写 kebab-case。根目录 `references/` 下的理论笔记使用中文文件名，并保持“一个理论一个笔记”。模块不得运行时依赖根目录 `references/`；需要随包使用的理论材料必须复制到模块自己的 `references/` 目录。

## 面向用户的 AI 安装话术

用户通常尚未克隆仓库，因此用户文档中的安装话术必须直接给出 GitHub 模块链接，而不是要求用户输入本地路径或执行 `cp`。默认话术固定为：

> 请帮我安装 [k12-learning](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning) 和 [llm-wiki](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki)。

按需模块分别使用：

- [k12-automation](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-automation)
- [k12-skill-studio](https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-skill-studio)

不要在面向普通用户的首页、快速开始、安装指南或 SOP 中展开宿主目录、克隆、复制命令和内部 playbook；让 AI 根据链接自行处理实现。安装话术单一来源是 `docs/ai-install-prompt.md`；安装后的能力与调用话术单一来源是 `skills/k12-learning/references/system-user-guide.md`。

## 测试指南

每个 Product Module 必须包含 `test-prompts.json`，用于保存真实可回归的测试提示。修改模块时，检查 frontmatter、资源链接、Schema 和行为用例。当前契约为 **4 个 Product Module、61 个内部 playbook、58 个学习能力、63 条旧入口迁移映射**。新增或删除 Product Module 属于架构变更，必须先更新 `CONTEXT.md` 与 ADR；新增学习能力时同步更新 `skills/k12-learning/references/capability-map.json` 和回归用例，并运行 `bash pipeline/review.sh all`。

## 提交与 PR 规范

近期提交使用类似 Conventional Commits 的前缀，例如 `feat:`、`docs:`、`chore:`。提交应聚焦单一目的，并说明变更价值。PR 应概述修改的 Skill 或文档、列出已运行的验证命令，并说明剩余风险或刻意未改的范围。

## 安全与配置提示

遵循 `SECURITY_BASELINE.md`：未经用户明确同意，不建立长期记录、不发送提醒、不把本地学习数据外传。模块间默认不共享状态；跨模块传递必须有明确目的和最小范围。自动化运行时只放在 `skills/k12-automation/scripts/nightline/`，密钥与真实学生数据不得提交。
