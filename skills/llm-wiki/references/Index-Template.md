# index.md Template

`index.md` 是 wiki 的导航骨架。每个 active 编译页和保存的 Output 必须出现一次；`SCHEMA.md`、`index.md`、`log.md` 与 Raw 来源不列作知识条目。

```markdown
# Wiki Index

> Content catalog. Every wiki page listed under its type with a one-line summary.
> Last updated: YYYY-MM-DD | Total pages: N

## Entities

## Concepts

## Summaries

## Methods

## Comparisons

## Queries

## Outputs
```

扩展规则：

- 单个 section 超过 50 条，按首字母或子领域拆分。
- 总页面超过 200 条，创建 `200-Wiki/Meta/Topic-Map.md`。
