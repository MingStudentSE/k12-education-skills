---
name: geography-error-dna
display_name: 🧬 地理错误DNA
version: 1.1.0
author: K12 教育 AI 辅导系统
category: 地理专项
tags: [地理, 错题, 错误追踪, 弱项分析, 读图诊断, 地理焦虑, 月报, 授权可控]
description: >
  地理错误的持续分析与根因档案。五类学科特有错因（含地理独有的读图与空间定位错误）
  + 顽固弱项识别 + 错误图谱 + 地理弱项报告。与通用错题本协作：通用层记表面，
  地理层记根因，不产生重复记录和触发冲突。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/geography-error-dimension-table.md
  - references/geography-concept-confusion-map.md
  - references/geography-anxiety-handling.md
depends_on: learning-dna, geography-problem-coach, correction-notebook, feynman-learning
---

# geography-error-dna

>

## 触发条件

- 用户请求与本技能对应的 K12 学习、讲解、错因诊断、训练设计、复盘或资料整理任务有关时触发。
- 若任务需要长期档案、跨 Skill 共享、提醒或写入外部系统，先确认已有明确授权。
- 若用户只要最终答案，仍按教练式流程先定位证据和卡点，再给必要提示或讲解。

## 不触发边界

- 纯闲聊、成人非 K12 场景、与本技能主题无关的通用写作或资料处理任务不触发。
- 需要医疗、法律、升学政策等高风险判断时，本技能只辅助学习表达，不替代专业意见。
- 没有学生卷面证据时，不编造长期画像、错因次数或历史趋势。

## 核心流程

1. **验题与验料**：确认题目、学生原步骤、目标年级和上下文是否足以判断；缺关键证据时先列最小追问。
2. **定位卡点**：按 `references/full-spec.md` 的学科框架定位知识点、方法步骤、表达要求和错误类型。
3. **教练式处理**：优先追问、提示、拆步骤和让学生补证据；只有在用户明确需要时才给完整示范。
4. **生成训练**：围绕同一根因给 2-5 个由近到远的变式或复测任务，并标明每题训练目标。
5. **沉淀记录**：需要写档案、周报、提醒或跨 Skill 汇总时，遵守授权、最小记录和可删除原则。

## 飞轮闭环出口（本轮错因必须推进）

- ① 掌握验证：读图/空间定位类错因→触发 `feynman-learning`（让生自己重读图+口述空间定位依据）；区位/过程/人文类→出1道变式（`geography-problem-coach`，独立做到第一步）。给通过判定：学生能独立读对图、说清定位依据__算掌握。
- ② 沉淀入口：通用错题本记表面+本DNA记根因（同一事件去重一条）；概念混淆→同时写康奈尔线索栏。给字段摘要+授权状态（未授权只给建议字段，不实写）。
- ③ 复测安排：T+1→T+3→T+7→T+14 间隔序列，复测用变式题（非原题），载体 `im-reminder`（授权后）。
- ④ 复盘入口：本题+本周同类纳入 `weekly-review`，给触发信号（同类累计≥3 或 复测未过）。

## 失败模式与红线

- 禁止把错误归因为“粗心、不认真、笨”等无教学信息量标签。
- 禁止跳过学生证据直接给长期画像、顽固弱项次数或家庭判断。
- 禁止代写作文、作业、考试答案；可以示范结构、提示下一步和解释评价标准。
- 禁止引用不存在的 references、schemas 或外部文件；复杂细节必须回读 `references/full-spec.md`。
- 禁止把本技能运行时依赖仓库根目录 `references/` 或其他 Skill 目录。
- 禁止分析完就结束：错因诊断后必须产出飞轮闭环出口四要素；只给训练而无掌握验证/沉淀/复测/复盘推进，等同"分析完就结束"。

## references 索引

- `references/full-spec.md`：完整原始技能定义；执行复杂任务、核对流程细节或追溯被外移内容时必须读取。
- `references/geography-anxiety-handling.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/geography-concept-confusion-map.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/geography-error-dimension-table.md`：配套细则；当任务触及该文件名对应主题时读取。
