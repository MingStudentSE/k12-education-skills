---
name: physics-error-dna
display_name: 🧬 物理错误DNA
version: 1.0.0
author: K12 教育 AI 辅导系统
category: 物理专项
tags: [物理, 错题, 错误追踪, 弱项分析, 图景诊断, 物理焦虑, 月报, 授权可控]
description: >
  物理错误的持续分析与根因档案系统。核心功能：五维错因分类（图景建立、概念混淆、公式误用、过程分析、数学工具）
  + 顽固弱项识别 + 物理弱项报告。通用错题本记录表面事实，本 SKILL 只记录物理根因，不重复存档或触发。
compatibility: Claude Code / Codex / OpenClaw / ClawHub
references:
  - references/physics-error-dimension-table.md
  - references/physics-concept-confusion-map.md
  - references/physics-math-tools-checklist.md
  - references/physics-diagram-guide.md
depends_on: learning-dna, physics-problem-coach, correction-notebook
---

# 🧬 物理错误DNA SKILL

> 普通错题本告诉你“哪道物理题错了”；物理错误DNA追踪“为什么总在同一类图景/模型/工具上出错”。

## 1. 触发与核心流程

适用：物理错因模式、模型混淆、数学工具缺口、顽固物理弱项、物理焦虑信号分析。不适用时转普通回答或更合适 SKILL。

1. **收集最小输入**：错题/图片、学生步骤、已有图像或草图、历史同类错误；缺信息先给模板，不臆造长期数据。
2. **诊断主错因**：按五维只选一个主类型，可记录次要关联。
3. **给出证据**：引用学生原步骤、图、口述或历史重复点说明为什么这样判。
4. **产出修复任务**：给一个本周可执行的小任务和下一次检查方式。
5. **授权写入**：只有用户同意后才写档案、同步 learning-dna、创建提醒或月报。

## 2. 与 `general/correction-notebook` 的边界

| 项目 | 通用错题本 | 本 SKILL |
|---|---|---|
| 入口 | 接收所有科目错题、拍题三信息法 | 接收物理错题的深度错因分析 |
| 记录 | 题目、答案、日期、来源、通用分类、复习状态 | P/C/F/R/T 子类型、图景证据、跨维度关联、顽固弱项 |
| 触发 | 通用复习、跨科目汇总、统一提醒调度 | 物理 3 次同类触发、图景专项、物理月报内容 |
| 同步 | 需要物理根因时请求本 SKILL 摘要 | 只回写最小摘要，不重复存题、不重复提醒 |

核心原则：**通用层记表面，物理层记根因；同一事件只存一条通用记录，物理 DNA 作为扩展诊断。**

## 3. 五维错因路由

| 主类型 | 什么时候用 | 关键参考 |
|---|---|---|
| P 图景建立错误 | 不会把文字转成受力图、电路图、过程图、图像含义 | `references/physics-diagram-guide.md`、`references/physics-error-dimension-table.md` |
| C 概念混淆 | 概念定义或相似概念混用，如速度/加速度、压力/压强 | `references/physics-concept-confusion-map.md` |
| F 公式误用 | 公式记得但条件、方向、单位或适用对象错 | `references/physics-math-tools-checklist.md` |
| R 过程分析错误 | 阶段划分、状态变化、因果链不完整 | `references/physics-error-dimension-table.md` |
| T 数学工具错误 | 物理思路对，代数、比例、单位、图像读数错 | `references/physics-math-tools-checklist.md` |

判定顺序：先查图景是否缺失；再查概念定义；再查公式条件；再查过程分段；最后确认是否只是数学执行。

## 4. 记录模板

```text
错题ID：日期+序号
知识模块/知识点：
通用错题本记录ID：如有则填
主错因：P/C/F/R/T + 子类型ID
次要关联：如 P11+C02，无则“无”
证据：学生原图、原句、步骤或历史重复点
图景类型：受力/运动过程/电路/光路/图像/无
根因一句话：
修复任务：下一次先做什么、怎么自检
授权状态：未授权/已授权写入/仅本轮分析
```

子类型与跨维度编码见 `references/physics-error-dimension-table.md`。

## 5. 顽固弱项与专项修复

当“相同错误类型 + 相同知识点标签”出现 3 次，才提示进入顽固弱项跟踪；不要把一次偶发错误放大成长期结论。

专项输出必须包含：

- 触发证据：3 次记录或用户明确提供的历史证据。
- 根因假设：为什么不是粗心、不是单纯计算错。
- 最小训练：1 个示范、2 个同类、1 个变式迁移。
- 复查点：下次错题如何判断是否已攻克。

## 6. 物理焦虑处理

学生出现“我物理不行/一看图就怕/电学全废”等表述时：

1. 先承认感受，禁止贴“粗心/笨/没天赋”标签。
2. 用档案证据缩小问题：具体到某一类图景、概念或工具。
3. 给一个可完成的低门槛动作，例如“只画受力图不计算”。
4. 需要长期画像或提醒时先请求授权，只同步最小摘要。

## 7. 输出格式

```markdown
## 物理错因DNA诊断
- 主错因：
- 子类型/证据：
- 次要关联：
- 与通用错题本的关系：新增扩展诊断 / 回写摘要 / 仅本轮分析

## 修复任务
1. 先做：
2. 自检：
3. 下次复查：
```

## 参考资源

- `references/physics-error-dimension-table.md`：P/C/F/R/T 五维错因、子类型与证据要求。
- `references/physics-concept-confusion-map.md`：常见物理概念混淆与澄清路径。
- `references/physics-math-tools-checklist.md`：公式条件、单位、比例、图像等数学工具核查。
- `references/physics-diagram-guide.md`：受力图、电路图、过程图与图像题的图景证据规范。

## 9. 失败与降级红线

- 信息不足：输出补充模板，不编造学生水平或历史。
- 只要答案：可给快速答案，但说明不会自动写入 DNA。
- 边界不清：先交给通用错题本记录表面事实，再由本 SKILL 做物理根因扩展。
- 高风险联动：未获授权不得更新长期画像、月报、提醒或跨 SKILL 共享。
