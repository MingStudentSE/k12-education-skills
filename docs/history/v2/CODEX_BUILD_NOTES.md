> **历史快照（无当前权威）**：本文件只记录 V2 当时的设计或执行过程。不要把其中的路径、Skill、依赖、路由、命令或“必须”表述用于当前四 Product Module；当前规则以根 `AGENTS.md`、`CONTEXT.md`、ADR 和现行 module 契约为准。

# CODEX 构建记录 v2.1

日期：2026-06-20

## 构建文件

新增 `skills/general/student-quick-assessment/`：

- `SKILL.md`
- `references/intake-question-bank.md`
- `references/grade-subject-matrix.md`
- `references/persona-template.md`
- `schemas/intake-persona.schema.json`
- `test-prompts.json`

新增 `skills/general/system-quality-scoring/`：

- `SKILL.md`
- `references/scoring-rubric.md`
- `references/blind-test-protocol.md`
- `references/judge-prompt.md`
- `scenarios/S1-senior2-physics-error.md`
- `scenarios/S2-junior3-all-subjects-zhongkao.md`
- `scenarios/S3-senior1-xuangake-direction.md`
- `scenarios/S4-privacy-boundary-probe.md`
- `scenarios/S5-grade-fit-probe.md`
- `schemas/scorecard.schema.json`
- `test-prompts.json`

未改动既有 60 个 SKILL 的内容。

## 文档同步

- `README.md`：新增 v2.1 重点变化；通用层 15→17；总数 60→62；快速开始加入首次接触先跑画像师；核心飞轮加入前置入口；通用工具表加入两个新 SKILL。
- `docs/architecture.md`：总数 60→62；通用层表新增 #16/#17；后续学科编号顺延；协作架构新增前置入口层；目录树新增两个新目录。
- `RELEASE_NOTES.md`：新增 v2.1 最新版本条目。
- `docs/changelog.md`：新增两个 SKILL v1.0.0 状态行和 v2.1 维护记录；当前状态同步为 62/17。
- `AGENTS.md`：stale 计数从 35/15 更新为 62/17。

## 保守偏离与理由

- 未发现需要推翻设计的矛盾。
- `intake-persona.schema.json` 中 `gradeLevel`、`subjectSet`、`track.combination` 等字段使用 `{ value, confidenceLevel }` 对象而不是裸字符串，理由是执行指令要求每个推断字段和 list 项可附 `confidenceLevel`，并且更贴近 `SECURITY_BASELINE.md` 的字段级约束。
- `docs/architecture.md` 目录树同步时补入了既有 `educational-llm-wiki/`，否则通用层目录树无法与 17 个目录计数一致；这只修正文档树，不改既有 SKILL。

## 校验命令输出

```bash
$ find skills -name SKILL.md | wc -l
      62

$ find skills/general -mindepth 1 -maxdepth 1 -type d | wc -l
      17

$ test -d skills/general/student-quick-assessment && echo OK1
OK1

$ test -d skills/general/system-quality-scoring && echo OK2
OK2

$ for f in skills/general/student-quick-assessment/SKILL.md skills/general/system-quality-scoring/SKILL.md; do echo "$f: $(wc -l < $f) lines"; done
skills/general/student-quick-assessment/SKILL.md:       77 lines
skills/general/system-quality-scoring/SKILL.md:       82 lines
```

附加 JSON 合法性检查：

```bash
JSON OK skills/general/student-quick-assessment/schemas/intake-persona.schema.json
JSON OK skills/general/system-quality-scoring/schemas/scorecard.schema.json
JSON OK skills/general/student-quick-assessment/test-prompts.json
JSON OK skills/general/system-quality-scoring/test-prompts.json
```
