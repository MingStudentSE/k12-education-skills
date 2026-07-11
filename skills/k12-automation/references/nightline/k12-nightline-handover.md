# K12 Automation 运行时交接

## 所有权

夜间错题产线属于 `k12-automation`，教学方法来自相邻或显式配置的 `k12-learning`。运行时不能修改 playbook，也不能自进化。

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
- `K12_LEARNING_DIR`：`k12-learning` 绝对路径；其次读 `config.json.learningDir`，最后查找相邻 module。
- `K12_TIME_ZONE`：IANA 业务时区，默认 `Asia/Shanghai`。
- `K12_MOCK_LLM=1`：不请求外部模型，用于确定性回归。

本地 `config.json` 位于脚本同目录并被忽略。旧根目录 `engine/` 与 `students/_template/` 已废弃。

## 安全契约

- profile 必须通过结构化本地授权检查；真实模型还必须匹配 provider origin、固定 scope 与有效日期。
- OCR 每次单独确认；请求体、图片数和单张/总大小均有限制。
- `--student` 只接受安全 ID；缺值、非法、不存在均非零退出。
- `server.mjs` 只绑定 `127.0.0.1`；不得为“方便”改成 `0.0.0.0`。
- 单项失败保留 inbox；批次部分失败返回非零且不得汇报全成功。

## 教学加载契约

`night-run.mjs` 从 `k12-learning/references/playbooks/` 载入学科错误、解题和通用错题 playbook。新学科映射必须：

1. 指向实际存在的 `playbook.md`；
2. 只载入当前学科所需资源；
3. 保持学生原步骤证据和“不臆造长期弱项”红线；
4. 通过 module contract、Mock 和 server smoke。

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
- `assets/student-template/profile.md` 保持 `authorized: false`。
- 安装后数据根与模块目录分离。
- `docs/k12-nightline-guide.md` 与模块内 `references/nightline/` 内容同步。
