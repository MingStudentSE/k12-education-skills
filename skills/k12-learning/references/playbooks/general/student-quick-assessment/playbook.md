---
name: student-quick-assessment
display_name: 🪪 学生快速评测
version: 1.1.0
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [入学定位, 人物画像, intake, 文理选科, 证据库存, 种子画像, 授权, 路由分支]
description: >
  K12 学习总路由的 intake 分支——在首次接触且没有明确题目或任务时，通过快速评测定位：学段年级、需要哪些科目、
  文理或新高考选科方向、有没有近期作业/试卷/错题、授权意向。产出可路由、可喂给 learning-dna
  的种子画像。当学生说"我是XX年级""帮我看看我该怎么学""我不知道从哪开始""帮我建档"
  或首次接触无明显学科任务时激活。已有明确题目、作文、实验、笔记或计划时不拦截，由
  k12-learning 直接选择专业 playbook。轻量、推断优先、未授权只给会话内画像不建长期档案。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/intake-question-bank.md
  - references/grade-subject-matrix.md
  - references/persona-template.md
  - schemas/intake-persona.schema.json
depends_on: learning-dna
---

> **内部 playbook**：本文件由旧 Skill 迁移，不是平台可发现 interface。文中的“调用/转交 Skill”统一解释为当前 Product Module 内部组合；Product Module 主文件、授权门与安全规则优先。

# 🪪 学生快速评测

> intake 专家：只在没有明确任务时，用少量信息定位学段、科目、方向和证据库存；不是所有 K12 请求的必经入口。

## 触发边界

- **用我**：由 `k12-learning` 内部决策判定为 `INTAKE`；首次接触且没有明确任务；学生说“怎么学”“从哪开始”“帮我做初步定位”。
- **不用我**：已有明确题目、作文、实验、笔记或计划时直接转专业 SKILL；已建档且只要单任务时直达专业 SKILL；只验证某概念理解时转 `feynman-learning`。
- **最小输入**：学段年级、主攻方向、是否有作业/试卷/错题材料；不足时给批量补充模板，不臆造。
- **授权门前置**：未获明确同意时，只输出本轮会话画像；不得写入 `learning-dna`、提醒或跨 SKILL 共享。

## 流程骨架

1. **判通道**：首句信息密度高走快车道；信息稀薄走完整道。
2. **激进推断首句**：能从“高二理科”“初三中考”等明示信息推断的字段先标注为初步判断。
3. **批量补缺**：一轮问完缺口，使用多选快回，不逐项审讯。
4. **证据库存盘点**：确认有没有近期作业、试卷、错题本，以及格式是拍照、文字还是文件。
5. **授权确认**：说明是否需要建档、共享最小摘要或提醒；用户不同意则停在会话内画像。
6. **输出画像卡 + 路由提示**：给 `meta.consentStatus`、`routingHints`、`evidenceInventory`、`seedForDNA`。
7. **授权后种子交付**：仅在用户同意建档时，把最小种子交给 `learning-dna` 深化。

## 七字段 intake 清单

| 字段 | 推荐问法 | 默认置信 | 路由去向 |
|---|---|---|---|
| `gradeLevel+textbookVersion` | “你是几年级？教材大概是人教/北师大/苏教/沪教还是不确定？” | `insufficient_sample` | 学段适配、教材对齐 |
| `subjectSet` | “这次主要想管哪些科目？可多选：语数英物化生政史地/全科。” | `insufficient_sample` | 学科 SKILL 选择 |
| `trackOrCombination` | “初中是全科/中考？高中是文理分科还是 3+1+2？组合是什么？” | `insufficient_sample` | 文理/选科路由 |
| `goalsAndTimeline` | “最近目标是什么？多久后考试？每天大概能学多久？” | `insufficient_sample` | `learning-plan`、DNA 种子 |
| `evidenceInventory` | “手边有没有近期作业、试卷、错题本？能拍照/发文字/传文件吗？” | `insufficient_sample` | 错题本、学科诊断 |
| `personaSnapshot` | “你自评强弱项和喜欢的讲解节奏是什么？” | `insufficient_sample` | 画像假设，待验证 |
| `consentStatus` | “是否同意建立长期学习档案？是否允许本次把最小摘要交给相关 SKILL？” | `insufficient_sample` | `learning-dna` 授权门 |

## 输出要求

- 结构化画像卡必须通过 `schemas/intake-persona.schema.json`：包含 `meta`（授权状态位于 `meta.consentStatus`）和 `routingHints`；有材料时再补 `evidenceInventory`、`seedForDNA`、`personaSnapshot`。
- 每个推断字段都要带 `confidenceLevel`，默认 `insufficient_sample`；明示但未验证为 `preliminary_trend`；有证据验证后才可 `data_sufficient`。
- `personaSnapshot` 只写可验证的初步观察，不把一次自评固化为标签。
- 末尾必须给建议的下一步学习动作，并说明为什么；内部 playbook 名只在用户追问路由依据时展示。
- 未授权时输出纯文本会话画像；授权后才输出可交给 `learning-dna` 的最小种子。

## 失败红线

| ❌ 禁止 | ✅ 替代 |
|---|---|
| 未授权就建立长期档案或写入 DNA | 只给会话内画像，并询问是否开启 |
| 索要成绩单原件、身份证、学校全称等高敏信息 | 只要低敏摘要：年级、科目、错题类型、考试时间 |
| 把“我数学差”当成最终结论 | 标为 `insufficient_sample`，用试卷/小测验证 |
| 为了完整七字段强问到底 | 快车道先上路，缺口放到下一步补 |
| 替学生选科或评判文理优劣 | 记录事实、目标和限制，只给信息整理与风险提示 |
| 默认把画像共享给所有 SKILL | 只在当前任务需要且获授权时共享最小字段 |

## references 索引

- `references/intake-question-bank.md`：七字段问题库、快/全双通道、首句推断规则和补充模板。
- `references/grade-subject-matrix.md`：学段、科目、文理/选科组合与本仓库 SKILL 路由真值表。
- `references/persona-template.md`：画像卡、DNA 种子、协调器路由和未授权兜底模板。
- `schemas/intake-persona.schema.json`：结构化 intake 画像的唯一字段契约；需要输出 JSON 或跨 Skill 交付时读取。
