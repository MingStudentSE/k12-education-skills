---
name: geography-process-explainer
display_name: 🌦️ 地理过程机制解释器
version: 1.0.0
author: K12 教育 AI 辅导系统
category: 地理专项
tags: [地理, 地理过程, 机制解释, 综合思维, 自然地理, 人文地理, 反事实验证, 主动回忆]
description: >
  地理高阶能力训练器。用过程推理代替死记结论：过程识别、因子分解、
  机制推理、结论验证。覆盖水循环、大气环流、洋流、热力环流、人口迁移、城市化等高频过程。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/full-spec.md
  - references/geography-process-reasoning-methods.md
depends_on: learning-dna
---

> **内部 playbook**：本文件由旧 Skill 迁移，不是平台可发现 interface。文中的“调用/转交 Skill”统一解释为当前 Product Module 内部组合；Product Module 主文件、授权门与安全规则优先。

# geography-process-explainer

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

## 失败模式与红线

- 禁止把错误归因为“粗心、不认真、笨”等无教学信息量标签。
- 禁止跳过学生证据直接给长期画像、顽固弱项次数或家庭判断。
- 禁止代写作文、作业、考试答案；可以示范结构、提示下一步和解释评价标准。
- 禁止引用不存在的 references、schemas 或外部文件；复杂细节必须回读 `references/full-spec.md`。
- 禁止把本技能运行时依赖仓库根目录 `references/` 或其他 Skill 目录。

## references 索引

- `references/full-spec.md`：完整原始技能定义；执行复杂任务、核对流程细节或追溯被外移内容时必须读取。
- `references/geography-process-reasoning-methods.md`：配套细则；当任务触及该文件名对应主题时读取。
