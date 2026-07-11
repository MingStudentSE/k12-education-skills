# 双盲评测协议 v1.0.0

目标：让不同引擎在同一场景、同一 rubric 下可比，避免裁判知道身份后产生偏差。

## 1. EUT 跑场景

- EUT = engine under test，被测引擎。
- 每次运行先创建 `runDir = logs/scoring/YYYY-MM-DD_<engine-or-run>/`，例如 `logs/scoring/2026-06-19_gpt5.5/`。
- 按 `scenarios/` 中的 `scriptedTurns` 逐条喂给 EUT。
- EUT 必须使用当前已装 SKILL 响应，保留完整多轮 trace。
- trace 写入 `<runDir>/raw/<engine>/<scenario>.md`。
- EUT 不自评，不改场景，不提前查看裁判结论。

## 2. 脱盲

- 将 `<runDir>/raw/<engine>` 目录复制或重命名为 `<runDir>/blind/A`、`<runDir>/blind/B`。
- 删除或替换 trace 中的引擎名、模型名、运行者标识、CLI 输出等身份线索。
- 揭盲映射保存为 `<runDir>/MAPPING.md`，裁判打分前不可见。

## 3. 交叉裁判

- A 引擎裁 B 的 trace，B 引擎裁 A 的 trace。
- 裁判只拿：匿名 trace、对应场景文件、`references/scoring-rubric.md`、`references/judge-prompt.md`。
- 每场景输出一张 scorecard；多裁判时取同场景同维度均值。所有 scorecard、聚合 JSON 和人读报告都写回同一个 `<runDir>`，不得写入 `pipeline/`。

## 4. live 与 dry_run

- `live`：真实多轮运行场景，保留每轮对话 trace。
- `dry_run`：裁判读 SKILL 和场景后模拟推演；必须在 `meta.evalMode` 标 `dry_run`。
- dry_run 不得冒充 live；对比时应按模式分组。

## 5. 揭盲

- 只有 scorecard 完成并锁定后，才能打开 `blindId ↔ engine` 映射。
- 揭盲报告只比较维度差异和行为证据，不用引擎身份倒推修改分数。

## 6. 回归

- 系统升级前后必须使用相同 `rubricVersion` 与 `scenarioSetVersion` 才能直接横比。
- 若 rubric 或场景内容变更，必须 bump 版本，旧分保留但不直接同分对比。
- 回归结论应写清：分数变化、变化维度、证据片段、是否触发红线封顶。
