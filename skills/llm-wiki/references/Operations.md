# LLM Wiki Operations

## Initialize

1. 确认 `WIKI_PATH`、领域和目标目录现状。
2. 已有大量文件时停止套模板，改走增量适配。
3. 列出新增目录与控制文件，等待确认。
4. 创建四层、`AGENTS.md`、`SCHEMA.md`、`index.md`、`log.md`。
5. 写初始化日志并报告真实路径。

## Ingest

1. 按来源类型放入 `100-Raw/articles|papers|transcripts`；非 Markdown 原件放 `999-Assets`。
2. 对 frontmatter 后正文计算 SHA-256；同 hash 跳过，内容变化保留旧快照并建立新 dated snapshot。
3. 搜索 index 与现有实体、概念、比较页。
4. 只有满足页面阈值才新建，否则更新已有页或只保留 Raw。
5. 加 wikilink、SCHEMA 允许的 tags、sources、confidence 和 provenance。
6. 运行 link-integrity loop。
7. index 只更新一次，log 只追加一条批次记录，最后报告全部 changed files。

## Query

1. 读 index，再搜索 `200-Wiki` 与 `300-Output`。
2. 只加载回答所需页面。
3. 用 wikilink 标注使用的编译页。
4. 普通查问只在会话回答；durable synthesis 才写 `300-Output/queries`。
5. 写入 Output 时同步 index、log 与 link-integrity loop。

## Bulk ingest

先读完本批来源，统一识别实体与概念，只做一次 existing-page search，一次更新页面，一次更新 index，一条 batch log。若预计更新超过 10 个既有页面，执行前确认。

## Archive

1. 完全被替代的编译页移入 `200-Wiki/_archive/` 并保留类型路径。
2. Output 对应移入 `300-Output/_archive/`。
3. 从 active index 移除；inbound links 改为纯文本加“archived”。
4. 记录 log 并重跑链接检查。
5. Raw 永不 archive 或改写。
