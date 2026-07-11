# K12 Education Skills 全仓审计（2026-07-11）

> **历史审计快照**：本文记录 v2.3 的 63-Skill 状态及其问题。ADR-0001 后，这些问题已通过四 Product Module 重构处理；当前架构与路径请以 [`architecture.md`](architecture.md) 和 [`legacy-skill-mapping.json`](legacy-skill-mapping.json) 为准。

## 结论

本轮从 Skill 目录、frontmatter、references、schemas、测试提示、依赖图、运行引擎、安全模板、安装文档和 Obsidian 接入规则九个层面审阅了整个仓库，并实现了全局路由入口。

当前仓库共有 63 个 Skill：18 个通用 Skill、45 个学科 Skill；包含 188 个本地 reference 文件、7 个 JSON Schema/示例 JSON 和 203 条测试提示。新入口 `k12-learning-router` 注册并显式测试了全部 62 个既有目标。

当前判断是：**目录结构与全局路由已经可用，运行层伪授权问题已修复；长期档案和跨 Skill handover 的 Schema 安全边界仍需在下一轮优先加固。** 本文不是“所有安全风险已清零”的认证。

## 本轮已完成

1. 新增 `skills/general/k12-learning-router/`（唯一总路由模块与默认自然语言入口；宿主高置信直达是同一契约的快速路径）：
   - 只依据当前请求和已安装 Skill 元数据分流，不读档、不写入、不创建提醒。
   - 支持 `DIRECT / INTAKE / ORCHESTRATE / CLARIFY / ORDINARY` 五种常规模式，以及 `TARGET_UNAVAILABLE` 异常结果。
   - 注册表覆盖 62/62 个既有目标；70 条回归用例覆盖全部目标、冲突、隐私、非 K12 和能力缺失。
   - 路由本体通过 Codex 官方 `quick_validate.py`；`agents/openai.yaml` 可解析。
2. 收敛职责：
   - `student-quick-assessment` 只负责“没有明确任务”的 intake。
   - `skill-coordinator` 只负责确需多个结果衔接的编排，不再承担全局分流。
3. 修复运行层伪授权：
   - 学生模板默认 `authorized: false`。
   - 网页建档必须明确勾选同意并填写低敏授权摘要。
   - 本地建档校验结构化主体/日期/方式；真实模型处理另校验提供方 origin、固定范围和日期；OCR 每次单独确认。
   - 撤权或无效授权时，动态首页和静态 dashboard 不再读取/展示姓名、archive、弱项、待处理项或 outbox；文件接口返回 403。
   - 未授权负例必须非零退出，且不得生成 outbox/archive。
4. 修复契约和元数据漂移：
   - intake 输出与 `intake-persona.schema.json` 对齐。
   - scorecard 场景约束与 S1-S8 对齐。
   - 修复两个不存在的物理 Skill 名称。
   - 补齐 23 个 reference 和 5 个 schema/校验资源声明。
5. 扩展质量门：
   - 固定校验 63 个总 Skill、18 个通用 Skill。
   - 校验注册表目标数、路径、canonical name 和 62/62 显式测试覆盖。
   - 校验所有本地 references/schemas 必须在 frontmatter 声明。
   - 增加未授权夜跑负例与模板占位符检查。

## 尚未解决：P0

### 1. 学习档案 Schema 没有执行授权条件

`skills/general/learning-dna/schemas/dna-profile.schema.json` 声明了 `profileEnabled`、`emotionTrackingConsent` 等授权字段，也说明 `learningEmotion` 只能在同意后记录，但 Schema 没有 `if/then` 条件把授权状态与数据块绑定。未授权对象仍可携带情绪档案并通过校验；顶层目前只要求 `meta`。

同时，111 个字符串节点中只有极少数设置 `maxLength`。未解决问题、学习节点描述和 AI 评语等字段可接收超长文本或不应进入档案的个人信息。

建议下一步：

- 用条件 Schema 约束 profile、情绪、跨 Skill 共享和提醒数据块。
- 所有自由文本设置 `maxLength`，数组设置 `maxItems`。
- 为未授权情绪数据、身份证号/电话、超长文本增加必须失败的 fixture。

### 2. handover Schema 接受任意 payload，且两份协议已分叉

`skill-coordinator` 与 `correction-notebook` 各有一份 v2.0 handover Schema。对象没有统一采用 `additionalProperties: false`，也没有按 `handoverType` 强制对应 payload。当前可把 `profile_writeback` 与任意 `rawPII` 字段组合并通过校验。

两份 Schema 的学科、recipient 和学科错因维度枚举也不一致，政史地测试所需字段无法被现有协议完整表达。

建议下一步：

- 建立一份可生成到各独立 Skill 的协议单一来源。
- 用 `oneOf` 或 `if/then` 绑定 handoverType 与 payload。
- 默认关闭额外字段，限制文本和数组长度，加入 PII 负例。
- 保持发布包独立安装：由生成脚本复制协议，不在运行时跨目录引用。

## 尚未解决：P1

### 3. 16 个 Skill 主文件过浅且高度同质

`educational-llm-wiki` 以及地理、历史、政治共 16 个 Skill 的主文件使用高度相似的通用模板，真实能力主要藏在 `references/full-spec.md`。其中 Wiki 主文件还出现了“验题、变式题”等与知识库能力不匹配的通用话术。

本轮补齐了 `full-spec.md` 的 frontmatter 声明，但没有重写这 16 个 Skill。建议逐个保留真正的触发边界、状态机和输出契约，让主文件成为“深模块接口”，而不是同一层薄包装。

### 4. `depends_on` 混合了硬依赖、软协作和路由关系

当前依赖图有 4 个循环强连通分量：

- `correction-notebook / math-error-dna / math-problem-solving-coach / physics-error-dna / physics-problem-coach`
- `geography-error-dna / geography-problem-coach`
- `history-error-dna / history-problem-coach`
- `politics-application-coach / politics-error-dna`

建议拆成无环的 `requires`，以及不参与安装/启动顺序的 `integrates_with`、`routes_to`。总路由已明确禁止把现有 `depends_on` 当启动顺序。

### 5. 原有 62 个 Skill 的测试大多不能形成行为回归

旧基线中 55/62 个测试文件只有两条；60/62 个主 happy path 直接点名 Skill；38 条 happy path 只列“已有材料”字段而没有真实题面、草稿或数据。安全测试几乎没有覆盖撤回、删除、危险实验、提示注入和错误路由。

新路由的 70 条测试已经采用自然语言和显式 expected route，但旧 Skill 仍建议统一迁移到可机判测试契约：`skill / case_type / fixture / expected_route / must_include / must_not_include / side_effects`。

### 6. 平台元数据没有统一转换层

新路由把仓库自定义信息放进官方允许的 `metadata`，并通过 Codex 官方校验；其余 62 个 Skill 仍使用官方校验器不接受的顶层 `version / tags / references / compatibility` 等字段，也没有 `agents/openai.yaml`。

建议明确“仓库内部 metadata schema → Codex/Claude/OpenClaw 发布格式”的生成流程，不要让同一份手写 frontmatter 同时承担所有平台契约。

### 7. Skill 本地 Schema 校验仍有双轨依赖

本轮新增了已固定版本的 `pipeline/requirements.txt` 与 `pipeline/validate_schemas.py`。主质量门现在可在安装该依赖后编译 6 份 Schema，并运行 route、intake 和 DNA fixture。

但 `learning-dna/schemas/validate.js` 仍依赖 Ajv，而 `.gitignore` 同时忽略其 `schemas/package.json` 和 lockfile；Skill 目录自己的 JavaScript 校验路径仍不能在干净 checkout 单独复现。

建议下一轮删除这条重复校验路径，或把 Skill 本地固定版本依赖清单和 lockfile 纳入发布包；不要把开发机缓存当成验证证据。

## 建议实施顺序

1. 先修两个 P0 Schema，并增加恶意/未授权 fixture。
2. 建统一 metadata、测试用例和协议生成器，把生成后无 diff 加入 CI。
3. 重写 16 个浅包装 Skill 的主接口，先从 `educational-llm-wiki` 开始。
4. 将 `depends_on` 分拆为硬依赖、软协作和路由关系。
5. 为旧 62 个 Skill 逐批补自然触发、具体材料、相邻路由、安全撤回和失败红线测试。

## 已运行验证

```bash
bash pipeline/review.sh all
node --check engine/night-run.mjs
node --check engine/server.mjs
python quick_validate.py skills/general/k12-learning-router
python3 pipeline/validate_schemas.py
git diff --check
```

另做了：路由 Schema 14 个正负例、网页结构化授权/外部处理/OCR/撤权冒烟测试、两个独立代理 32 次自然语言盲测，以及全仓 Markdown 本地链接检查。未运行真实付费模型端到端夜跑；这仍需要使用者自己的 API key。
