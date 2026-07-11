# LLM Wiki Architecture

## 目录

```text
WIKI_PATH/
├── AGENTS.md
├── 100-Raw/
│   ├── articles/
│   ├── papers/
│   └── transcripts/
├── 200-Wiki/
│   ├── SCHEMA.md
│   ├── index.md
│   ├── log.md
│   ├── entities/
│   ├── concepts/
│   ├── comparisons/
│   └── _archive/
├── 300-Output/
│   ├── queries/
│   └── _archive/
└── 999-Assets/
```

## 层职责

- `100-Raw`：来源证据；现有正文不可改写。来源更新时保存 dated snapshot。
- `200-Wiki`：agent 维护的实体、概念、比较、Schema、导航和日志。
- `300-Output`：值得复用、分享或重新推导成本高的结论。
- `999-Assets`：PDF、图片、音频等非 Markdown 资产。

## SCHEMA 单一来源

`200-Wiki/SCHEMA.md` 至少包含：

1. Domain
2. Conventions
3. Frontmatter
4. Raw Frontmatter
5. Tag Taxonomy
6. Page Thresholds
7. Update Policy

编译页和 Output 的文件名统一使用 lowercase kebab-case。每页包含：

```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | summary | method | query | output
tags: []
sources: []
confidence: high | medium | low
contested: false
contradictions: []
---
```

Raw 文件 frontmatter：

```yaml
---
source_url: https://example.com/article
ingested: YYYY-MM-DD
sha256: <frontmatter 之后正文的 sha256>
---
```

## 页面阈值

- 实体/概念出现在至少两个来源，或是单一来源的核心对象时才建页。
- 现有页面可承载时优先更新，不为 passing mention 建页。
- 页面超过约 200 行时按领域语义拆分。
- 多来源综合标记 provenance；弱证据和快速变化内容不得标高 confidence。
