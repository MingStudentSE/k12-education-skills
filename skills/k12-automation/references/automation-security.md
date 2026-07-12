# Automation 授权状态

| 动作 | 最低确认 |
|---|---|
| 仅生成提醒计划 | 当前请求 |
| 创建真实提醒 | 内容、时间/频率、渠道、授权 |
| 本地 Automation 运行状态 | 主体、日期、方式 |
| 外部模型分析 | provider origin、固定 scope、日期 |
| OCR | 每一批图片单独确认 |
| 导出 | 精确学生 ID、目标位置、验收 |
| 删除 | 精确学生 ID、删除范围、二次确认 |

外部处理固定 scope：`current-mistake,recent-3-archives`。Automation v1 不读取 Learning profile；旧 scope 不兼容。Provider 记录 `new URL(apibase).origin`；provider 或 scope 变化后重新授权。

撤回分为：

- 只撤外部：本地运行状态继续有效，夜间真实模型停止；OCR 始终是另一条逐批授权，不继承该授权。
- 撤本地：本地与外部都失效，读写与看板聚合被阻断；数据是否删除另行确认。
