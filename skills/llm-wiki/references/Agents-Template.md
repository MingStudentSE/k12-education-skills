# AGENTS.md Template

Use this template when initializing a new LLM Wiki.

```markdown
# AGENTS.md

## Domain
[这个 wiki 覆盖的领域]

## Architecture

```text
100-Raw     = immutable source material
200-Wiki    = compiled knowledge network
300-Output  = reusable deliverables
999-Assets  = attachments and exported assets
```

## Conventions
- 文件名和子页面使用首字母大写，无空格；多词用连字符，例如 `Transformer-Architecture.md`。
- 每个 wiki 页面必须有 YAML frontmatter。
- 每个新 wiki 页面至少有 2 个有意义的出站 `[[wikilinks]]`。
- 更新页面时必须更新 `updated` 日期。
- 新页面必须加入 `index.md`。
- 每个维护动作必须追加到 `log.md`。
- 多来源综合页面应使用 provenance markers 标明关键 claims 的来源。

## Frontmatter
```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | summary | method | comparison | query | output
tags: []
sources: []
confidence: high | medium | low
contested: false
contradictions: []
---
```

## Raw Frontmatter
```yaml
---
source_url: https://example.com/article
ingested: YYYY-MM-DD
sha256: <body-hash>
---
```

`sha256` 只对 frontmatter 之后的正文计算，用于重入库时判断来源是否漂移。

## Tag Taxonomy
[定义 10-20 个顶层标签。使用新 tag 前必须先加入这里。]

## Page Thresholds
- 实体/概念出现在 2+ 来源，或是单一来源的核心对象，才创建页面。
- 已有页面可以承载时，优先更新已有页面。
- 一带而过的提及、次要细节、领域外内容，不创建页面。
- 页面超过约 200 行时拆分。
- 完全被取代的页面移入 `_archive/`，并从 index 移除。

## Update Policy
当新信息与旧内容冲突：
1. 检查来源日期和可信度。
2. 真矛盾时记录双方观点、日期和来源。
3. 在 frontmatter 中标记 `contested: true` 或 `contradictions:`。
4. 在 lint 报告中提示用户复核。
```
