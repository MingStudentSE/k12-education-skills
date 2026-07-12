---
name: k12-automation
description: 执行需要真实副作用的 K12 自动化。用户明确要求创建、查看、暂停或取消学习提醒，运行夜间错题分析，使用图片 OCR，生成/查看错题看板，管理学生运行授权，或部署定时任务时使用。提醒依赖宿主调度 adapter；夜间产线使用本 module 自带 scripts/nightline。未获明确授权时只输出可复制计划，不创建提醒、不建档、不外传、不运行付费模型。
---

# K12 Automation

把提醒和夜间错题运行收敛到一个副作用 seam。教学判断归 `k12-learning`；本 module 只在明确请求和授权后执行 adapter。

## 先选择操作

- **文本提醒建议**：无需执行副作用，给出时间、内容和复测节奏即可。
- **真实提醒**：读取 `references/playbooks/automation/im-reminder/playbook.md` 及必要 references，确认调度平台、渠道、时间、频率和授权。
- **夜间错题产线**：读取 `references/nightline/k12-nightline-handover.md`，使用 `scripts/nightline/`。
- **学生/错题网页控制台、OCR、授权更新**：运行 `scripts/nightline/server.mjs`。
- **静态看板**：运行 `scripts/nightline/build-dashboard.mjs`。

## 真实提醒流程

1. 确认提醒内容、目标时间/频率、渠道、时区和授权主体。
2. 明确宿主平台是否真的提供调度/消息 adapter；没有 adapter 时只生成计划，禁止声称提醒已创建。
3. 创建前展示将写入的任务、下一次触发时间、渠道和控制口令。
4. 执行后读取真实任务 ID/状态并报告；失败时返回平台错误，不伪装成功。
5. 支持“查看、暂停、恢复、取消、调频、今天不要提醒”；夜间默认 22:00–08:00 免打扰。

## 夜间产线流程

1. 确认 Node.js ≥18、工作目录、学生数据目录和业务时区。
2. 从 `scripts/nightline/config.sample.json` 创建本地 `config.json`；真实模式校验 endpoint、key、model，不提交密钥。夜间教学只读取 k12-learning 提供的版本化 night-analysis-v1 adapter，不读取其内部 playbook 目录。
3. Automation 授权/运行状态写入学生目录的 `automation/state.json`，与 Learning 拥有的 `profile.md` 分离；旧 profile 授权只做只读兼容。外部模型处理需独立授权，OCR 每次发送图片前另行确认。
4. 使用精确学生 ID 运行；`--student` 缺值、非法 ID 或不存在学生必须非零退出，不可回退全员。
5. 检查 outbox、archive、processed、日志和失败摘要；部分失败不得汇报批次成功。
6. 撤回后停止分析；只撤外部时保留本地数据，撤本地时阻断读取与写入；导出和删除由用户分别决定。

## 命令入口

从希望保存 `students/`、`logs/` 和 `dashboard.html` 的数据根目录运行：

```bash
node /path/to/k12-automation/scripts/nightline/server.mjs
node /path/to/k12-automation/scripts/nightline/night-run.mjs --student stu-001
node /path/to/k12-automation/scripts/nightline/build-dashboard.mjs
```

运行时通过当前 module 路径发现脚本，不把示例绝对路径写进配置或长期文件。自动化部署时可设置：

- `K12_ROOT`：数据根目录，默认当前工作目录。
- `K12_LEARNING_ADAPTER`：Learning 夜间分析契约文件；默认从相邻 k12-learning module 解析 night-analysis-v1 adapter。
- `K12_TIME_ZONE`：IANA 时区，默认 `Asia/Shanghai`。
- `K12_MOCK_LLM=1`：只做流程回归，不外传、不产生真实诊断。

## 安全红线

- 安装 module、制定计划或授权本地建档，不等于允许真实提醒、外部模型或 OCR。
- 不把 API key、学生数据、日志、dashboard 或授权记录提交版本库。
- 服务只绑定 `127.0.0.1`；远程访问必须经安全隧道，不直接暴露公网。
- OCR 最多 6 张、单张编码后 8,000,000 字符、总计 24,000,000 字符，并要求视觉模型与人工校对。
- 不因无回应连续推送；普通日最多 3 条，考前最多 5 条，用户可随时暂停。

## 资源

- `references/playbooks/automation/im-reminder/`：提醒方法、间隔与控制策略。
- `references/nightline/`：学生/家长指南与运营手册。
- `scripts/nightline/`：确定性 Node.js 运行层。
- `assets/student-template/`：默认未授权且不含 Learning profile 的 Automation 运行模板。
