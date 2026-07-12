---
adapter_contract: k12-learning/night-analysis
contract_version: v1
request_schema: ../../schemas/night-analysis-request-v1.schema.json
output_schema: ../../schemas/night-analysis-output-v1.schema.json
policy_sections: input-boundary,analysis-task,output-contract,red-lines
policy_rules: evidence-first,single-primary-cause,history-threshold-3,adaptive-practice,mastery-criterion,no-state-inference,no-fake-side-effects
---

# 夜间错题分析 Adapter 契约 v1

本文件是 `k12-learning` 提供给副作用运行时的稳定、版本化 interface。它把夜间离线分析所需的教学判断收进一个完整契约；调用方不得遍历 `references/playbooks/`、猜测 playbook 名称，或把内部目录结构当作运行时 API。

## 输入边界

调用方必须加载本文件 frontmatter 声明的 `request_schema`，并在调用模型前验证一份最小请求：业务日期、学科、可选的低敏学习摘要、最多 3 份近期错题档案和当前错题。Automation v1 不直接读取 Learning State，因此学习摘要固定声明“未提供”；未来如需传递，必须另建由 Learning 显式产出的版本化 input，不得猜测 `profile.md` 路径。没有历史时也明确写“未提供”，不得补猜。

授权、模型提供方核验、读取文件、写入档案、移动 inbox 和发送提醒均不属于本契约，由 `k12-automation` 在调用前后负责。授权事实也不得被当作教学证据。

## 分析任务

1. 先还原题目要求、学生的实际步骤与首个可验证偏差。证据不足时明确不确定点，并列出最想补问的 2 个问题；离线模式下可以给“基于现有证据的暂定判断”，但不能编造学生回答。
2. 只选择一个主错因，可记录一个次要关联。通用主类为：概念理解、读题/信息提取、方法/过程、计算/表达、检查/策略。禁止用“粗心”“笨”“没天赋”代替可训练的根因。
3. 学科诊断时使用以下观察镜头：
   - 数学：概念 C、运算 B、方法 M、读题 R；定位到首次失效步骤。
   - 物理：图景 P、概念 C、公式 F、过程 R、数学工具 T；公式前必须核对对象、条件和方向。
   - 化学：概念/守恒、反应条件与现象、方程式、实验流程、计算。
   - 生物：结构与功能、过程链、条件变量、图表证据、术语表达。
   - 语文：文本证据、语境、结构作用、表达规范；语病需给可复用检查步骤。
   - 英语：语境含义、句法结构、词形/搭配、时态语态、篇章证据。
   - 历史：时空定位、史实边界、材料证据、因果层级、观点表达。
   - 地理：区域定位、图表读取、尺度与过程、因果链、规范表述。
   - 政治：设问范围、材料映射、概念边界、论证链、术语表达。
   - 综合：使用通用主类，不假装具备某一学科的专属证据。
4. 历史记录只用于验证“是否复发”。只有至少 3 条可对应的记录，或输入明确给出等价历史证据时，才可标为顽固弱项；否则写“本次记录，不足以判断长期趋势”。
5. 给出一句话根因和一个最小修复动作。修复必须对应主错因，而不是泛泛建议多刷题。
6. 生成 3–5 道变式：第一题直击根因，随后逐步增加表征变化或迁移；每题注明考查点。答案必须逐题对应，并指出旧错误最可能在哪一步复发。
7. 给出掌握判据：学生需独立复述关键概念/画出图景，或独立完成一题的关键第一步。可建议 T+1、T+3、T+7、T+14 复测，但不得声称提醒已经创建。

## 输出契约

只输出以下四节，标记各占独立一行；最后输出 `<<<END>>>`。标记之外不加寒暄。调用方必须加载 frontmatter 声明的 `output_schema`，把四节解析为结构化输出并在任何写入前验证；Mock 与真实模型不得使用不同的解析或校验路径。

```text
<<<DIAGNOSIS>>>
# 错因诊断
- 主错因：
- 证据：引用当前输入中的原步骤或原句
- 一句话根因：
- 不确定点/离线补问：
- 长期判断：本次记录 / 有证据的复发 / 顽固弱项
- 最小修复与掌握判据：

<<<ARCHIVE>>>
---
date: YYYY-MM-DD
subject: math|physics|chemistry|biology|chinese|english|history|geography|politics|general
topic: 低敏知识点
error_type: 可复用错因标签
recurrence_count: 正整数
---
题目摘要、学生原步骤证据、根因、订正要点和复测判据。

<<<PROBLEMS>>>
3–5 道变式题，标注每题考查点和难度梯度。

<<<SOLUTIONS>>>
逐题完整解答；指出旧错误可能复发的步骤。

<<<END>>>
```

## 红线

- 不读取或臆造请求之外的学生数据，不推断真实身份、学校、住址、联系方式或完整成绩单。
- 不把一次错误写成稳定画像，不伪造历史次数、授权状态、提醒状态或文件写入结果。
- 不因历史档案中的结论与当前步骤冲突而忽略当前证据。
- 不输出内部 playbook 名称、目录路径或跨 module 调度指令。
- 不把答案和诊断混在档案 frontmatter 中；所有字段必须是低敏、单行值。
