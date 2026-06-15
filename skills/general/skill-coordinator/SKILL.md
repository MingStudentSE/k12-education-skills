---
name: skill-coordinator
display_name: 🔗 SKILL联动协调器
version: 1.1.3
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [联动, 协调, 错题本, 费曼测试, 康奈尔笔记, 理科题目掌握, 学习计划, 学习区, 85%规则, 时间专注, 月报, 系统级]
description: >
  让错题本、费曼测试、康奈尔笔记、理科题目掌握与学习计划、时间专注数据在明确任务下协同工作，
  并在任务过易或过难时进行学习区校准。
  当学生说“帮我生成全景月报”“学习系统运转得好吗”“联动分析这道题”时可激活此SKILL。
  仅在当前任务需要且用户已同意相关数据使用时，按最小必要字段汇总，不默认跨SKILL全量拉取或写回。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/learning-zone-principles.md
  - references/one-week-linkage-record.md
depends_on: learning-dna, correction-notebook, feynman-learning, cornell-notes, science-solving-four-steps
---

## 触发边界

- 仅当学生明确要求多 SKILL 联动、系统健康检查、全景月报，或需要判断“这道题应先交给谁、何时补链”时激活。
- 单一错题先交 `correction-notebook`；单一笔记先交 `cornell-notes`；单一提醒先交 `im-reminder`；普通答疑不强行联动。
- 读取长期档案、同步提醒、写回学习 DNA 或跨 SKILL 共享前，必须说明字段、理由和路径，并取得用户授权。
- 只拉取当前任务所需最小摘要；用户可指定“本次不联动某个 SKILL”或“不要写回”。

## 流程骨架

1. **判定任务**：确认是联动判断、健康检查、全景月报还是单题补链；不匹配则转交对应技能或普通回答。
2. **收集最小输入**：当前任务、已授权数据摘要、需联动范围；证据不足时先给补充模板，不臆造历史数据。
3. **按链路编排**：依据 `references/trigger-routing-rules.md` 决定先触发、后转交或并行汇总。
4. **校准学习区**：用 85% 规则判断熟悉区/学习区/挫败区；过易加变式与迁移，过难拆任务、补前置或降难度。
5. **输出结果**：给出联动判断、系统状态、月报/健康检查、下一个最关键动作。
6. **写入与提醒**：若需沉淀，使用 `schemas/handover-protocol.schema.json` 校验；未授权不写档、不建提醒、不共享。

## 触发顺序与转交规则

```text
协调器启动条件
  ├─ 多 skill 联动/系统健康/月报：协调器先汇总最小授权摘要
  └─ 单一任务：先交对应技能，必要时再回到协调器补链

错题/单题主线
  错题本 → 理科题目掌握 → 康奈尔笔记 → 费曼测试 → 学习计划/时间专注 → IM提醒
```

- **先触发错题本**：记录错误、定位根因、判断是否为固定模式。
- **理科题再补单题掌握**：拆结构、入口、关键步骤与变式迁移。
- **再查笔记**：看知识点是否已有康奈尔笔记或线索。
- **再验理解**：概念模糊、方法边界不清、同类错误>=3次、“看答案后觉得懂了”、理科题说不出第一步来源时触发费曼。
- **执行问题再转计划/专注**：知道方法却拖延、计划有但总失败、复测/费曼约不上时补学习计划或时间专注。
- **提醒只在授权后并行**：复测、复习、行动回访由 IM 提醒轻联动；不默认同步。
- 原版未定义多个“必须触发”条件冲突时的总优先级，详见 `references/trigger-routing-rules.md` 的待拍板疑问。

## 失败红线

| ❌ 禁止 | ✅ 替代 |
|---|---|
| 按月自行触发全景月报 | 只在用户明确请求时生成 |
| 全量拉取全部活跃 SKILL 数据 | 只拉取当前任务所需摘要 |
| 默认写回学习 DNA 或提醒 | 先说明字段、路径、理由并获授权 |
| 把 85% 规则当机械评分 | 作为任务难度校准参考 |
| Schema 失败仍写入长期档案 | 阻断写入，降级为单会话纯文本诊断 |
| 多条件冲突时自造优先级 | 按原流程顺序处理，并把未定义处标为待拍板 |

## 参考资源

- `references/coordinator-operating-manual.md`：原版完整操作手册，含技术边界、最小闭环、全景月报、健康检查、联动记录、IM轻联动、强 Schema 协议和禁止行为。
- `references/trigger-routing-rules.md`：触发顺序、转交、并行和原版未明确定义的待拍板疑问。
- `references/one-week-linkage-record.md`：完整一周联动实录案例。
- `references/learning-zone-principles.md`：学习区、85%规则、间隔学习、多场景学习、测验与知识连接原则。
- `schemas/handover-protocol.schema.json`：多 Agent 数据交接、回写与提醒同步的强 Schema。
