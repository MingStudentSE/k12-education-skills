# Automation 授权状态

| 动作 | 最低确认 |
|---|---|
| 仅生成提醒计划 | 当前请求 |
| 创建真实提醒 | 内容、时间/频率、渠道、授权 |
| 本地长期建档 | 主体、日期、方式 |
| 外部模型分析 | provider origin、固定 scope、日期 |
| OCR | 每一批图片单独确认 |
| 导出 | 精确学生 ID、目标位置、验收 |
| 删除 | 精确学生 ID、删除范围、二次确认 |

外部处理固定 scope：`profile-summary,current-mistake,recent-3-archives`。Provider 记录 `new URL(apibase).origin`；provider 或 scope 变化后重新授权。

撤回分为：

- 只撤外部：本地档案继续有效，真实模型、OCR 外传停止。
- 撤本地：本地与外部都失效，读写与看板聚合被阻断；数据是否删除另行确认。
