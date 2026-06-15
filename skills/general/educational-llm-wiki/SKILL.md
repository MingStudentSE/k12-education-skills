---
name: educational-llm-wiki
display_name: 🧭 教育LLM知识库
version: 1.0.0
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [LLM Wiki, Obsidian, 学习知识库, 目录架构, 知识编译, 学习证据, 索引, 安全边界]
description: >
  帮学生、家长、老师或本地 AI 把 Markdown/Obsidian 学习仓库搭成教育版 LLM Wiki：
  使用 100-Raw / 200-Wiki / 300-Output 三层结构保存原始学习证据、AI 编译知识和输出成果。
  当用户说“搭建学习知识库”“适配 Obsidian”“整理学习 vault”“把资料编译成 wiki”
  “设计 100-Raw/200-Wiki/300-Output 目录”“维护学习总控台/索引/日志”
  “检查或安装 Obsidian skills”“没有 Obsidian skill 就安装 kepano/obsidian-skills”
  “健康检查学习知识库”“不要只做文档，要做教育 LLM Wiki skill”时，必须激活此 SKILL。
  核心功能：安全判断空仓库或已有仓库、建立教育目录模板、分类原始证据、
  将错题/笔记/资料/反馈编译为可链接 wiki 页面、检查并安装 Obsidian 官方 skills、
  维护索引与日志、把高价值回答沉淀回知识库。
compatibility: OpenClaw / ClawHub / Codex / Claude Code / Obsidian
references:
  - references/education-layer-rules.md
  - references/compile-workflow.md
  - references/obsidian-skill-install.md
  - references/real-vault-adaptation-pattern.md
  - references/recommended-directory-structure.md
---

# educational-llm-wiki

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

- `references/compile-workflow.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/education-layer-rules.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/full-spec.md`：完整原始技能定义；执行复杂任务、核对流程细节或追溯被外移内容时必须读取。
- `references/obsidian-skill-install.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/real-vault-adaptation-pattern.md`：配套细则；当任务触及该文件名对应主题时读取。
- `references/recommended-directory-structure.md`：配套细则；当任务触及该文件名对应主题时读取。
