# K12 Automation 运行时交接

## 所有权

夜间错题产线属于 `k12-automation`，教学判断来自 `k12-learning` 提供的版本化夜间分析 adapter 契约。运行时只能读取该契约，不能遍历或依赖 Learning 内部 playbook 目录，也不能自进化。

```text
skills/k12-automation/
├── SKILL.md
├── assets/student-template/
├── references/nightline/
└── scripts/nightline/
    ├── authorization.mjs
    ├── business-time.mjs
    ├── build-dashboard.mjs
    ├── config.sample.json
    ├── night-run.mjs
    └── server.mjs
```

## 路径契约

- `K12_ROOT`：学生、日志、dashboard 的数据根；默认 `process.cwd()`。
- `K12_STUDENTS_DIR`、`K12_LOG_DIR`：可选细分覆盖。
- `K12_LEARNING_ADAPTER`：`night-analysis-v1.md` 的显式路径；其次读 `config.json.learningAdapter`，最后读取相邻 Learning module 的固定 adapter 路径。
- `K12_TIME_ZONE`：IANA 业务时区，默认 `Asia/Shanghai`。
- `K12_MOCK_LLM=1`：不请求外部模型，用于确定性回归。

本地 `config.json` 位于脚本同目录并被忽略。旧根目录 `engine/` 与 `students/_template/` 已废弃。

## 安全契约

- `students/<id>/automation/state.json` 是 Automation 授权与运行状态的唯一写入目标；`profile.md` 属于 Learning State，Automation 不创建、不更新。
- 若新状态文件不存在，可只读解析旧 `profile.md` 的授权 frontmatter；不得读取姓名、年级或正文。用户更新或撤回授权后写入新状态文件并优先使用它，防止旧 profile 恢复已撤授权。
- v1 外部 scope 固定为 `current-mistake,recent-3-archives`；旧 `profile-summary,...` scope 失败关闭并要求重新授权。
- 本地授权必须通过结构化检查；真实模型还必须匹配 provider origin、固定 scope 与有效日期。
- OCR 每次单独确认；请求体、图片数和单张/总大小均有限制。
- `--student` 只接受安全 ID；缺值、非法、不存在均非零退出。
- `server.mjs` 只绑定 `127.0.0.1`；不得为“方便”改成 `0.0.0.0`。
- 单项失败保留 inbox；批次部分失败返回非零且不得汇报全成功。

## 教学加载契约

`night-run.mjs` 只加载 `k12-learning/references/adapters/night-analysis-v1.md`。契约必须声明 `adapter_contract: k12-learning/night-analysis` 和 `contract_version: v1`，并带四个输出标记；不兼容时失败关闭。请求数据遵循 Learning 拥有的 `schemas/night-analysis-request-v1.schema.json`。

新增学科或改变诊断方法时只在 Learning 内更新并升版契约；Automation 只适配公开 contract version。质量门必须确认运行文件不含 `references/playbooks` 或学科到 playbook 的映射。

## 回归

从仓库根目录执行：

```bash
node pipeline/validate_modules.mjs
python3 pipeline/validate_schemas.py
bash pipeline/review.sh all
```

质量门覆盖 authorization、业务时区、CLI 非法输入、server eager config、OCR 限制、25MB JSON 413、撤权生命周期和 Mock 夜跑。任何路径调整都必须同步上述 smoke scripts 和用户指南。

## 发布检查

- 模块中没有真实 `config.json`、学生数据、日志或 dashboard。
- `config.sample.json` 不含密钥。
- `assets/student-template/automation/state.json` 保持本地与外部授权均为 `false`，且模板中不包含 `profile.md`。
- 安装后数据根与模块目录分离。
- `docs/k12-nightline-guide.md` 与模块内 `references/nightline/` 内容同步。
