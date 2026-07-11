# log.md Template

`log.md` 是追加式行动日志。

```markdown
# Wiki Log

> Format: `## [YYYY-MM-DD] action | subject`
> Actions: create, ingest, update, query, lint, archive, delete
> Rotate when this file exceeds 500 entries.

## [YYYY-MM-DD] create | Wiki initialized
- Domain: [domain]
- Structure created with AGENTS.md, index.md, log.md
```

超过 500 条时轮转为 `log-YYYY.md`，然后创建新的 `log.md`。
