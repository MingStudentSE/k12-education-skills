# K12 Automation 运行时契约

## 所有权

夜间错题产线属于 `k12-automation`，教学判断来自 `k12-learning` 提供的版本化夜间分析 adapter 契约。运行时只能读取该契约，不能遍历或依赖 Learning 内部 playbook 目录，也不能自进化。

```text
skills/k12-automation/
├── SKILL.md
├── assets/student-template/
├── references/nightline/
└── scripts/nightline/
    ├── authorization.mjs
    ├── artifact-publisher.mjs
    ├── business-time.mjs
    ├── build-dashboard.mjs
    ├── config.sample.json
    ├── contract-runtime.mjs
    ├── migrate-legacy-authorization.mjs
    ├── night-run.mjs
    ├── runtime-config.mjs
    └── server.mjs
```

## 路径契约

- `K12_ROOT`：学生、日志、dashboard 的数据根；默认 `process.cwd()`。
- `K12_STUDENTS_DIR`、`K12_LOG_DIR`：可选细分覆盖。
- `K12_LEARNING_ADAPTER`：`night-analysis-v1.md` 的显式路径；其次读 `config.json.learningAdapter`，最后读取相邻 Learning module 的固定 adapter 路径。
- `K12_TIME_ZONE`：IANA 业务时区，默认 `Asia/Shanghai`。
- `K12_MOCK_LLM=1`：不请求外部模型，用于确定性回归。

本地 `config.json` 位于脚本同目录并被忽略。`server.mjs` 与 `night-run.mjs` 必须共同通过 `runtime-config.mjs` 读取和规范化 endpoint、key、model 与 Learning adapter 路径，不能各自维护一套配置解释；Mock 可在没有真实凭据时运行，但仍规范化显式 adapter 路径。旧根目录 `engine/` 与 `students/_template/` 已废弃。

## 安全契约

- `students/<id>/automation/state.json` 是 Automation 授权与运行状态的唯一写入目标；`profile.md` 属于 Learning State，Automation 不创建、不更新。
- steady-state runtime 只读取 `automation/state.json`，并在每次读取和写入时加载 `schemas/automation-state-v1.schema.json` 验证；缺失、额外字段、错误类型或不受支持版本一律失败关闭。
- `profile.md` 不再是授权 fallback。旧授权兼容仅存在于维护者显式运行的 `migrate-legacy-authorization.mjs`：它只读 frontmatter、一次性写入 Automation state、强制外部处理重新授权，且 state 已存在时拒绝再次迁移。
- migration exit criterion：所有受支持数据根连续一个发布周期执行 `migrate-legacy-authorization.mjs --audit` 均返回 `exit_ready: true` 后，删除迁移脚本及本条说明。steady-state runtime 不依赖此脚本，因此删除不会改变正常运行。
- v1 外部 scope 固定为 `current-mistake,recent-3-archives`；旧 `profile-summary,...` scope 失败关闭并要求重新授权。
- 本地授权必须通过结构化检查；真实模型还必须匹配 provider origin、固定 scope 与有效日期。
- OCR 每次单独确认；请求体、图片数和单张/总大小均有限制。
- `--student` 只接受安全 ID；缺值、非法、不存在均非零退出。
- `server.mjs` 只绑定 `127.0.0.1`；不得为“方便”改成 `0.0.0.0`。
- 单项产物先由 `artifact-publisher.mjs` 写入 student-local staging，再以 no-clobber 方式发布；任一写入或 inbox 移动失败必须回滚已发布产物、清理 staging 并保留原 inbox。批次部分失败返回非零且不得汇报全成功；同 stem 的 `.md` / `.txt` 不得互相覆盖。

## 教学加载契约

`night-run.mjs` 只加载 `k12-learning/references/adapters/night-analysis-v1.md`。契约必须声明 `adapter_contract: k12-learning/night-analysis`、`contract_version: v1`、相对 `request_schema`/`output_schema` 以及固定 `policy_sections`/`policy_rules` identity。运行时还会验证输入边界、分析任务、输出契约、红线四节顺序和关键教学行为；只剩 frontmatter 与输出 markers 的空壳必须失败关闭。Mock 与真实模型都先验证同一 request，再解析并验证同一 output，任何写入都发生在 output 验证之后。

新增学科或改变诊断方法时只在 Learning 内更新并升版契约；Automation 只适配公开 contract version。质量门必须确认运行文件不含 `references/playbooks` 或学科到 playbook 的映射。

## 回归

从仓库根目录执行：

```bash
node pipeline/validate_modules.mjs
python3 pipeline/validate_schemas.py
bash pipeline/review.sh all
```

质量门覆盖 state schema、adapter/request/output 删除测试、authorization、业务时区、CLI 非法输入、共享配置规范化、真实模型 night-run 与 `/api/run`、staging 写入/移动失败回滚、同 stem no-clobber、server eager config、OCR 限制、25MB JSON 413、撤权生命周期和 Mock 夜跑。任何路径调整都必须同步上述 smoke scripts 和用户指南。

## 发布检查

- 模块中没有真实 `config.json`、学生数据、日志或 dashboard。
- `config.sample.json` 不含密钥。
- `assets/student-template/automation/state.json` 保持本地与外部授权均为 `false`，且模板中不包含 `profile.md`。
- 安装后数据根与模块目录分离。
- `docs/k12-nightline-guide.md` 与模块内 `references/nightline/` 内容同步。
