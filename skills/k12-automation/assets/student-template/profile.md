---
id: stu-XXX
name: 某同学
grade: 初二
subjects: [math]
authorized: false
authorized_by:
authorization_subject:
authorization_date:
authorization_method:
external_processing_authorized: false
external_processing_provider:
external_processing_scope:
external_processing_authorization_date:
---

# 学习画像（种子版）

> 本模板默认未授权。只有学生本人或监护人明确同意建立本地学习档案后，才把
> `authorized` 改为 `true`，填写 `authorization_subject: student|guardian`、ISO 日期与
> `authorization_method: written|verbal|digital`；`authorized_by` 只写对应的低敏中文摘要。
> 若真实模型会收到低敏画像摘要、当前错题和最近 3 份错题档案，还需单独填写外部处理授权、
> 当前 `apibase` 的 origin（例如 `https://api.example.com`）、固定 scope
> `profile-summary,current-mistake,recent-3-archives` 与授权日期；提供方变化后重新授权。
> 不要把 scope 翻译、加空格或改变顺序。Mock 模式不外传。
> 第一次建档时，只写对这个学生**已知且与学习任务有关**的低敏倾向；不知道就留空。

- 学科整体水平：
- 已知倾向（例如：步骤记得快但说不出为什么 / 概念清楚但计算毛糙）：
- 监护人/老师关注点：
