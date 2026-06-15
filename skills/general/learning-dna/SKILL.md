---
name: learning-dna
display_name: 🧬 学习DNA
version: 1.2.0
author: K12 教育 AI 辅导系统
category: 通用核心
tags: [学习档案, 长期记忆, 个性化, 成长图谱, 通用, 隐私可控]
description: >
  AI"长期记忆"的核心引擎——学习DNA。仅在学生或监护人明确开启、
  或主动提出“记住我”“查看档案”“更新档案”“删除档案”等请求时激活。
  普通答疑默认不强制调用；未获同意时，仅允许使用当前会话信息，不建立跨会话档案。
  该版本已补充查看、更正、删除、暂停共享与最小化记录边界。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/cross-subject-connections.md
  - references/dna-template.md
  - references/growth-milestones.md
---

# 🧬 学习DNA SKILL

> 让 AI 在获得学生/监护人明确授权后，维护可查看、可更正、可删除、可暂停共享的学习画像与成长证据；未授权时只处理当前会话。

## 什么时候使用我

- 用户明确说“记住我”“建立/查看/更新/删除学习档案”“学习DNA”“长期偏好”“成长图谱”“学习证据编译”。
- 学生或监护人已开启档案，并要求基于经授权的学习记录、错题摘要、复盘摘要、目标或兴趣偏好生成画像。
- 其他白名单技能需要在当前任务中读取或写入最小学习摘要，且用户未暂停记忆/共享。
- 需要判断里程碑、跨学科连接、情绪基线、动机状态或长期弱项是否应进入档案。

## 什么时候不要使用我

- 普通答疑、单题讲解、临时写作/翻译/计算，不默认读取或建立长期档案。
- 用户没有授权、说“不要记/不要共享/先别建档”，或任务只需要当前会话信息。
- 只有模糊印象、未经验证的推测，不能写成长期标签；先保留在本轮对话或标低置信度。
- 非学习用途、未知第三方或未列入协作白名单的技能，不得访问或接收 DNA 内容。

## 核心流程

1. **判定触发与授权**：按触发词、任务类型和授权状态决定是否启用；完整判定见 `references/learning-dna-full-playbook.md` 的“二、触发时机”“三、使用前置条件与用户控制”。
2. **收集最小输入**：只要完成任务必需的学习记录、错题摘要、复盘摘要、当前目标；首次建档话术见 `references/dna-template.md`。
3. **建立/更新画像**：维护基础信息、学科状态、学习风格、成长图谱、兴趣 DNA、学习情绪维度；字段细则见 `references/learning-dna-full-playbook.md` 与 `schemas/dna-profile.schema.json`。
4. **验证证据再下结论**：把“懂了/没懂/进步了”转换为可验证证据，必要时用小题、复述或复盘确认；置信度规则见 `references/learning-dna-full-playbook.md`。
5. **输出可行动结果**：给学习画像摘要、优势/弱项/偏好、成长证据、更新建议和下一步行动；完整档案例见 `schemas/examples/full-profile.example.json`。
6. **写入与协同**：写入前说明路径和理由；跨技能只共享白名单最小字段，跨科关系可查 `references/cross-subject-connections.md`。
7. **复盘与里程碑**：满足标准时当场标注并告知学生；标准与话术见 `references/growth-milestones.md`。

## 失败模式与红线

- 不编造学生水平、历史记录、学习数据；信息不足时给最小补充模板。
- 不把“我懂了”直接写成掌握；必须验证或标注置信度。
- 不只记录失败，也记录攻克时刻；薄弱点写成“待解锁成就”，不写成缺陷标签。
- 不默认跨技能读取/写入；只同步当前任务需要的最小摘要，提醒类共享需单独同意。
- 不向未知技能、第三方或未声明用途的模块传完整档案。
- 用户要求查看、更正、删除、暂停共享时，优先执行数据权利流程，暂停其他写入。
- 难度失配时降级拆解或增加迁移，不用长期画像替学生完成可训练步骤。

## 参考资源

- `references/learning-dna-full-playbook.md`：原版完整流程外移；查触发、授权、DNA结构、情绪维度、行为规范、数据权利、协同白名单与禁止行为。
- `references/dna-template.md`：首次建档模板、引导话术、DNA更新触发词和30天成长里程碑。
- `references/growth-milestones.md`：时间/能力/习惯里程碑标准、触发话术和存储格式。
- `references/cross-subject-connections.md`：20个跨学科概念连接模板，供概念图谱和跨学科任务调用。
- `schemas/README.md`：学习DNA schema 目录说明与校验入口。
- `schemas/dna-profile.schema.json`：正式 JSON Schema，覆盖六大维度与 v1.1/v1.2 扩展。
- `schemas/examples/full-profile.example.json`：完整学习DNA档案例，用于核对输出字段。
- `schemas/validate.js`：schema 校验脚本；需要校验档案结构时运行。
