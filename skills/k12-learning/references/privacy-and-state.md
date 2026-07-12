# Learning State 与授权门

## 默认状态

只使用当前会话材料。讲题、解释、批改、会话内复盘和内部 playbook 组合不需要额外授权。

## 执行前必须确认

以下动作先说明“字段、目的、位置、保留时间、删除方式”，等待明确同意：

- 创建、读取、更新或删除跨会话 Learning State；
- 把学习内容写入 `llm-wiki`；
- 创建真实提醒或夜间任务；
- 向模型服务发送图片、画像摘要、当前错题或历史档案；
- 把历史摘要交给另一个 Product Module。

安装 module、同意当前讲题或允许内部组合，不等于同意以上动作。

## 最小字段

- 学习画像只记录与学习任务直接相关、可验证、可更正的低敏摘要。
- 一次自评或情绪不固化为长期标签。
- 不记录真实住址、身份证件、电话、账户、医疗诊断、家庭纠纷或财务细节。
- 学科长期弱项至少需要用户确认、多次证据或复测验证之一。

## 控制入口

支持并遵守：

- “只在本次会话使用”
- “查看/更正/删除我的学习档案”
- “这次不要记忆”
- “不要写入 Wiki”
- “不要共享给其他 module”
- “暂停/取消提醒”

撤回后停止后续处理；是否导出或删除已有数据由用户选择。不要把“撤回”自动解释为“立即永久删除”。

## Adapter 数据流

- 到 `llm-wiki`：只传当前产物或用户指定的最小摘要；不传完整 Learning State。
- 到 `k12-automation` 的提醒建议：只传用户当前提出的任务内容、期望时间和低敏运行标识；不得传递或代替调度授权。Automation 必须在自己的 interface 内展示任务、渠道、频率和下一次触发时间，并自行取得、保存和撤回授权。
- 到夜间分析 adapter：按 `schemas/night-analysis-request-v1.schema.json` 传当前错题和最多 3 份经授权的近期错题摘要；可选学习摘要必须由 Learning 明确产出，Automation 不得自行读取 `profile.md` 正文。
- Automation 独占调度授权、外部处理授权与运行状态；Learning 不在画像或 intake 中保存 reminder consent 或跨 module sharing 开关。Automation 不拥有 Learning profile，只能读取 `references/adapters/night-analysis-v1.md` 及其声明的 request/output schema，不遍历内部 playbook 目录。
- Adapter 不可反向要求全量读取画像来决定是否执行。
