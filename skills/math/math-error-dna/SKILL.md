---
name: math-error-dna
display_name: 🧬 数学错误DNA
version: 1.1.0
author: K12 教育 AI 辅导系统
category: 数学专项
tags: [数学, 错题, 错误追踪, 弱项分析, 数学焦虑, 月报, 授权可控]
description: >
  数学错误的持续分析与根因档案系统。仅在学生明确要求记录错题、分析弱项、
  生成数学报告或同意连续跟踪时激活。核心功能：四类错误分类 + 顽固弱项识别
  + 错误类型图谱 + 数学弱项报告。未获同意时，不建立长期档案、不默认跨SKILL共享。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/concept-confusion-map.md
  - references/math-error-dimension-table.md
  - references/reading-habits.md
  - references/math-error-dna-operations.md
depends_on: learning-dna, math-problem-solving-coach, correction-notebook
---

# 🧬 数学错误DNA

> 普通错题本记录“哪道题错了”；本 Skill 诊断“为什么总在同一类数学点上出错”，并把根因、趋势和突破计划沉淀为可授权的数学错因档案。

## 什么时候用我

- 用户要分析数学错因模式、概念混淆、长期错误画像、顽固弱项或数学弱项月报。
- 通用错题本 `correction-notebook` 已完成数学错题表面记录，转交基础四维标签、题目摘要、学生答案、正确答案和历史引用。
- 学生说“为什么我总在这种题上错”“我数学太差了”“生成数学月报”等，需要用数据定位根因或缓解数学焦虑。
- 数学解题教练完成错题分析后，用户同意把本次根因沉淀到数学错因档案。

## 什么时候不用我

- **通用错题管理**、跨学科错题收纳、拍题三信息法、提醒调度和学期全景报告入口 → 用 `correction-notebook`。
- 单题即时讲解、从零带学生解一道题 → 用 `math-problem-solving-coach`，只在学生同意记录错因时转入本 Skill。
- 概念本身没懂、需要重新讲概念 → 用 `math-concept-explainer`；本 Skill 只给出错因诊断和联动理由。
- 只想要快速答案、不愿建立档案或授权持续跟踪 → 只输出本轮诊断，不写入、不提醒、不跨 Skill 共享。
- 非数学科目错误或普通学习复盘 → 不触发本 Skill。

## 最小输入

1. 当前错题：题目摘要或图片文字、学生步骤/答案、正确答案或标准思路。
2. 初步标签：知识点、通用错题本基础四维标签，或学生自述的错因。
3. 历史证据：同类错误记录、出现次数、最近练习日期；没有就明确“暂无历史”。
4. 授权状态：是否允许写入档案、回写 `correction-notebook`、生成提醒或提供月报摘要。

信息不足时先发补充模板，不编造学生水平、历史记录或长期数据。

## 核心流程骨架

1. **判定边界**：确认是数学错因诊断而不是通用错题收纳；必要时转交 `correction-notebook`。
2. **收集证据**：用最小输入模板收齐错题、步骤、自述和历史；没有历史就只做单次诊断。
3. **四维归类**：在计算失误、概念模糊、方法用错、读题失误中选一个主维度，细则见 `references/math-error-dimension-table.md`。
4. **子类型定位**：定位 C/B/M/R 子类型，记录跨维度关联和一句话深度根因。
5. **纠偏与验证**：给出针对性练习、概念重建或读题习惯训练；概念混淆查 `references/concept-confusion-map.md`，读题问题查 `references/reading-habits.md`。
6. **档案与回写**：仅在授权后写入数学错因档案，并向 `correction-notebook` 回写数学专属字段，避免重复记录。
7. **趋势产出**：当用户要求图谱、月报或焦虑处理时，使用 `references/math-error-dna-operations.md` 中的报告模板和“数据替代情绪”流程。

## 输出格式

- **本轮诊断**：主维度 + 子类型ID + 证据句 + 深度根因。
- **纠偏策略**：今天能做的1个动作、3道以内验证题或1条自检清单。
- **档案动作**：写明“未授权不写入”或“已获授权，写入/回写字段如下”。
- **复测计划**：次日/3天后/下月月报等安排必须说明是否由 `correction-notebook` 统一调度。

## 失败模式与红线

- 不把“粗心”当终点；必须继续定位到符号、分数、概念、方法或读题等可训练根因。
- 不为凑趋势编造历史数据；没有档案时只输出当前样本诊断。
- 不绕过 `correction-notebook` 直接接收通用错题初始记录；数学专属层只记根因。
- 不在未授权情况下建立长期档案、设置提醒、写入学习DNA或向周复盘外发完整记录。
- 不重复触发预警：数学同类错误3次由本 Skill 执行突破，通用错题本只做统一入口与调度。
- 不用“你数学不行”这类标签；用具体数据把焦虑落到可解决任务。

## references 索引

- `references/math-error-dimension-table.md`：四维错因、C/B/M/R 子类型、跨维度关联、顽固弱项追踪和与通用错题本的数据流转。
- `references/concept-confusion-map.md`：概念模糊类错误的高频混淆对照，用于重建概念或联动概念解释器。
- `references/reading-habits.md`：读题失误的审题训练方法和关键词习惯。
- `references/math-error-dna-operations.md`：原主文件外移的档案记录格式、图谱/月报模板、数学焦虑流程和跨 Skill 协作协议。
