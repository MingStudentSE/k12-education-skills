# 快速开始

## 1. 选择模块

普通学习只安装：

- `k12-learning`
- `llm-wiki`（需要知识库时）

需要真实提醒、OCR、夜间分析或看板时再加 `k12-automation`。只有维护仓库时才加 `k12-skill-studio`。

## 2. 安装

直接把下面整段发给 AI：

```text
请帮我安装以下两个模块：
k12-learning：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/k12-learning
llm-wiki：https://github.com/MingStudentSE/k12-education-skills/tree/main/skills/llm-wiki
```

安装路径和具体操作由 AI 自行处理。其他模块话术见 [AI 安装提示词](ai-install-prompt.md)。

如果想先了解系统能做什么，以及第一次、平时、Wiki、提醒和夜间分析该怎么说，查看 [K12 学习系统用户指南](../skills/k12-learning/references/system-user-guide.md)。

## 3. 第一次先做材料驱动的快速启动

从手头任选一份近期课本、作业、试卷、错题或作文材料并发送：

```text
我是第一次使用。请基于这份材料做 3–5 分钟快速测评，不做全面测评；建立会话内初版学习 DNA，然后马上带我完成一个真实学习动作。跨会话保存前再问我。
```

系统只应补最小信息，用 1–3 个短动作形成“够开始”的画像，不得要求先填完整问卷。

## 4. 平时直接说目标

```text
我把这道二次函数题的过程发给你。先指出第一处错误，再给一级提示，别直接公布答案。
```

```text
我想用费曼方法检验“浮力”是不是真的懂了，你连续追问我。
```

```text
用“城市热岛”做一次跨学科侦探任务，控制在一周内完成。
```

`k12-learning` 会在内部选择数学、费曼或跨学科侦探 playbook。用户不需要知道这些名字。

## 5. 用 llm-wiki 长期沉淀资料

第一次先选择一种情况，不需要理解内部目录：

```text
我想新建一个学习 Wiki。请先说明结构和计划，等我确认后再创建。
```

```text
我有一个正在使用的 Obsidian/Markdown 知识库。请先盘点结构并给增量适配计划；不要批量改名或覆盖已有笔记。
```

日常把资料入库、查询和学习结果沉淀，分别这样说：

```text
把这份资料入我的 Wiki。保留原始材料，先展示会新增或更新哪些页面，再执行。
```

```text
把刚才确认过的错因写入我的 Wiki。目标目录是 /绝对路径；写之前先列出将修改的文件。
```

```text
在我的 Wiki 里找与“函数单调性”相关的笔记和错因；只返回本次复习所需的摘要。
```

没有明确确认时，不创建或修改 Wiki 文件；普通查询也不强制写入。完整的入库、查询、体检与确认边界见 [Wiki 用户指南](../skills/k12-learning/references/system-user-guide.md#wiki-怎么用)。

## 6. 需要真实执行时明确说

```text
每天 20:30 提醒我复习英语单词。创建前先展示渠道、频率和下一次触发时间。
```

没有调度 adapter 时，系统只能生成可复制计划，不应声称提醒已创建。夜间产线配置见 [用户 SOP](user-quickstart-sop.md) 和 [夜间产线指南](k12-nightline-guide.md)。

## 下一步

- [K12 学习系统用户指南](../skills/k12-learning/references/system-user-guide.md)
- [用户快速上手 SOP](user-quickstart-sop.md)
- [安装与升级指南](installation-guide.md)
- [四模块架构](architecture.md)
- [安全与隐私基线](../SECURITY_BASELINE.md)
