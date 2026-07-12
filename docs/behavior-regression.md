# Product Module 行为回归

本仓库把“提示语料”“静态契约”和“真实行为结果”分开计数。`skills/*/test-prompts.json` 当前共有 242 条 Product Module 自然语言行为 fixture（`k12-learning` 202 条、`llm-wiki` 16 条、`k12-automation` 14 条、`k12-skill-studio` 10 条）。其中 80 条 Learning 用例同时进入内部路由白盒子集，6 条同时进入课标证据子集；这些集合重叠，不能相加冒充更多用例。静态检查通过只证明 fixture 可加载且期望可判定，不代表模型行为已经通过。

## 两阶段黑盒执行

`pipeline/run_module_behavior_regression.mjs` 对每个 module batch 使用两个彼此独立的 Codex ephemeral context：

1. runner 把当前 module 复制到不含 `test-prompts.json` 的临时 SUT 树；generator 只读取该树中的 `SKILL.md`、必要本地资源和用户请求。macOS 外层 `sandbox-exec` 同时拒绝读取原仓库，因而不能取得 `expected`、`must_include` 或 `must_not_include`；缺少等价读取隔离时 live runner 失败关闭，不降级成伪黑盒。
2. evaluator 只拿冻结回答与验收条件，逐条返回 pass/fail，并引用回答中的精确文本证据；不得改写回答。

`pipeline/module-behavior-runner-smoke.mjs` 使用临时 fake Codex 主动尝试读取临时树和原仓库 fixture，确认前者不存在、后者返回 `EACCES/EPERM`；同时确认 generator stdin 不含期望、evaluator 才能看到冻结回答与条件。它只证明 runner 的阶段隔离和判定管线可执行，不是 live module 行为结果。

路由与课标 live runner 复用同一个 fixtureless SUT/source-read deny interface，不能从原仓库读取 `expected_route` 或 `expected_curriculum_evidence`。`pipeline/structured-regression-runner-smoke.mjs` 以临时 fake Codex 主动验证读取被拒绝，再穿过批量路由与课标 runner，确认 case ID、batch wrapper、逐项断言和 invocation 生命周期实际执行；它同样不冒充 live 模型结果。

`source_skill` 仅作为迁移来源记录。loader 不把它作为 case key、路由目标、依赖或 prompt 内容，语义门只检查当前 `id`、`prompt` 和期望字段。

先运行不调用模型的 fixture 契约：

```bash
node pipeline/run_module_behavior_regression.mjs --fixture-only
```

运行少量代表用例：

```bash
node pipeline/run_module_behavior_regression.mjs \
  --case k12-learning:first-use-rejects-comprehensive-assessment \
  --case llm-wiki:initialize-empty-wiki \
  --case k12-automation:no-runtime-no-fake-reminder \
  --case k12-skill-studio:insufficient-context \
  --model gpt-5.6-terra
```

四个 module 会各形成一个 batch，因此该命令是 4 次生成加 4 次独立评估，共 8 次 Codex 调用。

## 发布前 live 命令

```bash
node pipeline/run_module_behavior_regression.mjs --release --batch-size 20 --model gpt-5.6-terra --report /tmp/k12-module-behavior.json
```

`--release` 会在全部 Product Module 行为通过后，继续编排完整的 80 条路由白盒、6 条课标证据以及官方来源 live 校验；任一步失败都会令 release 失败。需要单独诊断时，仍可分别运行对应 runner。

按当前 242 条 module behavior fixture 和 `batch-size 20` 计算，行为阶段会形成 14 个 batch，即 28 次 Codex 调用；80 条路由白盒按 40 条一批使用 2 次，6 条课标证据同批使用 1 次。完整 live release 共 31 次 Codex 调用，另有一次教育部通知页和 9 份官方 PDF 的下载指纹、指定页章节及正式名称 OCR 校验。报告分别记录 planned、started、completed；启动失败不得计为 started。只有保存下来的 live report 与命令结果才能证明对应版本的行为通过。

教育部当前 PDF 为扫描页：macOS 使用系统 Vision OCR，其他平台需要 Poppler 的 `pdftoppm` 与带 `chi_sim` 语言包的 Tesseract；可用 `PDFTOPPM_BIN`、`TESSERACT_BIN` 覆盖路径。缺少可用提取器时来源校验失败关闭，不会退回到“只验整份 PDF hash”。

路由白盒测试只验证内部选择事实，属于次级回归；它不能替代四个 Product Module 的用户可见回答与安全行为回归。

## 自动化节奏

- `.github/workflows/gates.yml`：每个 PR 和 main push 在 GitHub Actions 上运行 `pipeline/review.sh` 全部 24 项静态门禁；门禁失败的 PR 不应合并。
- `.github/workflows/live-verification.yml`：每周一定时（可手动触发）联网下载 9 份教育部官方 PDF，复核 sha256、指定页章节标记和正式名称。该 workflow 失败代表官方来源漂移或 runner 网络不可达，不代表仓库损坏；来源漂移时应重新钉住 `curriculum/2022/standards.json` 中的证据。
- live 行为回归（本页上文的 `--release` 流程）依赖本地 Codex 凭据与配额，仍由维护者在发布前手动执行并保存 report。
