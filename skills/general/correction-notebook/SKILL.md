---
name: correction-notebook
display_name: ❌ 智能错题本
version: 1.3.0
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [错题, 错因分析, 弱项预警, 学期报告, 错误反馈, 变式验证, 全科通用, 必装]
description: >
  AI驱动的智能错题归档与分析系统。当学生发来错题、说“我这道题做错了”、
  “帮我分析错误原因”“出一道同类题”“我的错题本”或拍照发题并说明做错了时，
  必须激活此SKILL。该版本已整合拍题三信息法、弱项预警系统、学期全景报告
  与使用边界说明，不只是存题，而是持续定位和消灭错误模式。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/correction-operating-manual.md
  - references/error-analysis-framework.md
  - references/handover-protocols.md
  - references/physics-dimension-mapping.md
  - schemas/handover-protocol.schema.json
depends_on: learning-dna, math-error-dna, physics-error-dna, feynman-learning, cornell-notes
---
# ❌ 智能错题本 SKILL

> **一句话定位：** 从“收集错误”到“消灭错误基因”。先收最小信息，再定位根因、安排验证与复测。

## 什么时候用我

- 学生发来错题图片或题面，并说明“我做错了”“帮我看看哪里错了”。
- 学生提供自己的答案、正确答案/解析或卡点，要求做错因分析、订正、同类题、变式题。
- 学生请求查看错题记录、整理本章/考前错题集、生成学期错题全景报告。
- 已出现同一知识点/同一错误类型反复出错，需要判断弱项预警、复测或跨 SKILL 交接。

## 什么时候不用我

- 只是普通讲题、查概念、写作文、制定计划，且没有“做错/错因/复测/错题本”任务。
- 用户只要快速答案且明确拒绝错因训练时，只回答当前问题，不强行进入完整错题闭环。
- 只有情绪倾诉、学习规划或提醒创建，不包含错题材料时，转给更合适的技能或普通回答。
- 需要深度数学/物理错误 DNA 分析时，本技能只做基础记录和通用四维分类，再按协议交接。

## 核心流程骨架

1. **判断触发**：确认任务属于错题记录、错因分析、复测安排或错题模式归纳；否则说明更合适路径。
2. **收集最小输入**：至少要题面、学生答案、正确答案/解析、学生自述卡点；拍题先用“三信息法”。
3. **先说过程**：让学生复述解题过程或错在哪一步，再做分析，不一上来给答案。
4. **四维归因**：在概念理解、计算/操作、审题习惯、策略选择中标注至少一类；各科细分见 `references/error-analysis-framework.md`。
5. **订正与验证**：讲清一句话根因，安排同类、易混或跨场景变式题验证，形成再犯预警。
6. **档案与预警**：按错题档案结构写入；同类错误 3 次、章节失分集中、费曼未掌握或 14 天未复习时触发预警。
7. **飞轮闭环出口（强制）**：错因分析+档案预警完成后，本轮必须按四要素产出飞轮推进链（掌握验证/沉淀入口/复测安排/复盘入口），格式见下方「飞轮闭环出口」块。跨 skill 交接按 `references/handover-protocols.md`（含新增 `flywheel_handoff` 纵向飞轮协议）执行。

## 飞轮闭环出口（本轮错因必须推进）

- ① 掌握验证：概念类错因→触发 `feynman-learning`（让生自己复述+画图景）；方法/过程/计算类→出1道变式（`science-solving-four-steps`，独立做到第一步）。给通过判定：学生能说出/画出__算掌握。
- ② 沉淀入口：通用错题本记表面+对应学科DNA记根因（同一事件去重一条）；概念/模型混淆→同时写 `cornell-notes` 线索栏。给字段摘要+授权状态（未授权只给建议字段，不实写）。
- ③ 复测安排：T+1→T+3→T+7→T+14 间隔序列，复测用变式题（非原题），载体 `im-reminder`（授权后）。
- ④ 复盘入口：本题+本周同类纳入 `weekly-review`，给触发信号（同类累计≥3 或 复测未过）。

## 失败模式与红线

- **不得臆造数据**：信息不足时给补充模板；不要编造学生水平、历史记录或学习档案。
- **不得跳过学生思考**：不要把可训练的步骤直接替学生做完；先追问过程，再提示。
- **不得把错题当失败标签**：反馈必须聚焦“待攻克模式”，避免羞辱或贴标签。
- **不得只说“粗心/算错”**：必须追到根因、再犯信号和验证任务。
- **不得未授权写入**：长期档案、提醒、画像和跨 SKILL 共享都要先说明路径并获得授权。
- **不得重复触发专属技能**：数学顽固弱项由数学错误 DNA 处理；物理顽固弱项、五维子类型和焦虑处理由物理错误 DNA 处理。
- **不得伪造指针**：本技能 schema 只引用 `schemas/handover-protocol.schema.json`，禁止再指向其他技能目录。
- **不得分析完就结束**：错因分析后必须产出飞轮闭环出口四要素；只归档/预警而无掌握验证、复测时间点、复盘入口，等同本 SKILL `references/handover-protocols.md` 行为准则明令禁止的"分析完就结束"。

## 物理映射与 schema 要点

- 通用四维到物理五维不是 1:1：概念理解可落到 P 图景建立或 C 概念混淆，审题习惯可落到 P 或 C，计算/操作落到 T 数学工具，策略选择落到 F 公式误用或 R 过程分析。
- 物理交接必须附判断线索，字段和示例见 `references/physics-dimension-mapping.md`。
- 强 schema 协作使用本技能自包含文件 `schemas/handover-protocol.schema.json`。

## references 索引

- `references/correction-operating-manual.md`：需要拍题三信息法、档案模板、弱项预警、专项突破、错题集、学期报告或使用边界时读取。
- `references/error-analysis-framework.md`：需要各科常见错误类型、严重程度分级、数学/物理基础分类时读取。
- `references/handover-protocols.md`：需要与学习 DNA、IM 提醒、费曼测试、数学错误 DNA、物理错误 DNA 或协调器交接时读取。
- `references/physics-dimension-mapping.md`：处理物理错题从通用四维映射到 P/C/F/R/T 五维并填写交接字段时读取。
- `schemas/handover-protocol.schema.json`：构造或校验跨 SKILL 交接 JSON 时读取。
