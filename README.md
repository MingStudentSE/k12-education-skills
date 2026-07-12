# K12 Education Product Modules

> 当前发布版本：**V3.0**

把原来的 63 个公开 Skill 精简为 **4 个可安装 Product Module**。用户不再记 Skill 名；日常只需要自然描述目标，由模块内部选择和组合 61 个 playbook。

## 四个入口

| Module | 面向谁 | 什么时候用 |
|---|---|---|
| [`k12-learning`](skills/k12-learning/) | 学生、家长、老师 | 学科答疑、错题、学习 DNA、费曼检验、理科四步法、跨学科侦探、计划与复盘 |
| [`llm-wiki`](skills/llm-wiki/) | 需要知识沉淀的人 | 搭建、迁移、入库、查询和维护四层 Markdown/Obsidian Wiki |
| [`k12-automation`](skills/k12-automation/) | 需要真实执行的人 | 提醒、OCR、夜间错题分析、看板与本地控制台 |
| [`k12-skill-studio`](skills/k12-skill-studio/) | 仓库维护者 | 创建/审查 playbook、质量评分、行为回归与架构治理 |

这不是删除通用能力。学习 DNA、错题分析、理科四步法、费曼学习、康奈尔笔记、时间专注、周复盘和九大学科能力都保留在 `k12-learning/references/playbooks/`。原来的学习入口和总路由被收进 58 个内部能力，用户不再记名称。

不知道第一次或平时该怎么说？查看 [K12 学习系统用户指南](skills/k12-learning/references/system-user-guide.md)，按讲题、概念、错题、写作、实验、计划、专注、笔记、复盘和兴趣等目标复制话术。

## 3 分钟开始

普通用户直接把下面整段发给 AI：

```text
请帮我安装以下两个模块：
k12-learning：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning
llm-wiki：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki
```

需要提醒或夜间产线时，把 `请帮我安装 k12-automation：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-automation` 发给 AI。维护仓库时才安装 `k12-skill-studio：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-skill-studio`。安装路径和具体操作由 AI 处理。更多话术见 [AI 安装提示词](docs/ai-install-prompt.md)。

重启或刷新宿主后，第一次先拿出一份近期课本、作业、试卷、错题或作文材料，说：

```text
我是第一次使用。请基于这份材料做 3–5 分钟快速测评，不做全面测评；建立会话内初版学习 DNA，然后马上带我完成一个真实学习动作。跨会话保存前再问我。
```

以后直接说：

```text
这道函数题我在第二步卡住了，先别直接给答案，帮我找到卡点。
```

```text
我总把电场方向判断反。结合这道错题，帮我查错因并出一道变式题。
```

```text
把这篇课堂笔记整理进我的 Wiki；写入前先告诉我会改哪些文件。
```

无需点名“数学教练”“学习 DNA”或“理科四步法”。如需看路由理由，可以问“刚才用了哪些内部方法，为什么”。

完整话术见 [学习系统用户指南](skills/k12-learning/references/system-user-guide.md)，安装验证见 [用户快速上手 SOP](docs/user-quickstart-sop.md)，模块边界见 [架构说明](docs/architecture.md)。

## 自动化运行

`k12-automation` 带有确定性 Node.js 运行时。需要时直接说：

请帮我安装 k12-automation：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-automation，并帮我启用夜间错题分析。

真实模型、OCR、长期档案和提醒分别需要明确授权。`config.json`、真实学生数据、日志和看板不要提交版本库。详细步骤见 [夜间产线指南](docs/k12-nightline-guide.md)。

## 仓库结构

```text
skills/
├── k12-learning/       # 58 个学习能力，一个日常入口
├── llm-wiki/           # 四层知识库
├── k12-automation/     # 提醒与运行时
└── k12-skill-studio/   # 维护者工具
docs/
pipeline/
references/
```

旧的 63 个入口到新模块/playbook 的完整对应关系保存在 [`docs/legacy-skill-mapping.json`](docs/legacy-skill-mapping.json)，用于审计和回归，不作为用户菜单。

## 维护与验证

架构不变量：恰好 4 个 `SKILL.md`，内部 playbook 不得再嵌套 `SKILL.md`。

```bash
node pipeline/validate_modules.mjs
python3 pipeline/validate_schemas.py
bash pipeline/review.sh all
```

当前基线：4 个 Product Module、61 个内部 playbook、58 个学习能力、63 条迁移映射、221 个行为用例。贡献前请读 [`CONTEXT.md`](CONTEXT.md)、[`AGENTS.md`](AGENTS.md) 和 [`SECURITY_BASELINE.md`](SECURITY_BASELINE.md)。
