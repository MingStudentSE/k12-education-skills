---
name: llm-wiki
description: 构建、入库、查询、迁移和审计持久化 Markdown/Obsidian 知识库。用户要求创建 Wiki、整理已有 vault、摄取文章/PDF/转写、编译实体与概念、查询已沉淀知识、维护 index/log、检查 wikilink/frontmatter/来源漂移或把旧三层教育 Wiki 迁到四层结构时使用。采用 100-Raw、200-Wiki、300-Output、999-Assets 四层；写入前确认目标路径和变更范围，不自动读取 K12 学习档案，也不静默安装 Obsidian 依赖。
---

# LLM Wiki

把来源编译成可追溯、互联、可持续维护的 Markdown 知识库。人负责选择来源与确认变更；本 module 负责来源保真、知识编译、导航、日志和质量检查。

## 配置与写入门

1. 从用户明确给出的目录或 `WIKI_PATH` 解析知识库根；均未提供时使用 `~/wiki` 作为建议值，但在首次创建前必须展示绝对路径并确认。
2. 新建、迁移、批量入库、归档、删除或安装外部依赖前，先列出将改变的路径和数量。
3. 目标已有文件时先读取 `AGENTS.md`、`200-Wiki/SCHEMA.md`、`200-Wiki/index.md` 和 `200-Wiki/log.md` 最近 20–30 条；不覆盖本地规则。
4. K12 内容只处理用户当前提供或已明确授权传入的最小材料；不主动读取 `k12-learning` 的 Learning State。

## 四层结构

读取 `references/Wiki-Architecture.md` 并遵守：

```text
100-Raw     不可改写的来源快照
200-Wiki    编译知识、SCHEMA、index、log
300-Output  可复用或可分享的结论
999-Assets  PDF、图片、音频等非 Markdown 资产
```

`200-Wiki/SCHEMA.md` 是领域、命名、frontmatter、tag taxonomy、页面阈值和更新政策的单一来源。`AGENTS.md` 只声明工作约束并指向 SCHEMA，不复制另一套 taxonomy。

## 操作路由

- **初始化**：确认空目录或最小增量后，读取 `references/Agents-Template.md`、`Index-Template.md`、`Log-Template.md` 创建四层与三个控制文件。
- **入库**：读取 `references/Operations.md` 的 ingest 流程；原始正文不可改写，正文 hash 相同则跳过，变化则保存新快照。
- **查询**：先索引再搜索，只读必要页面；普通问答留在会话，昂贵且可复用的综合才写 `300-Output/queries/`。
- **lint/审计**：读取 `references/Lint-Rules.md`，按严重级别报告 broken links、孤儿、索引、frontmatter、taxonomy、来源漂移和冲突。
- **迁移旧教育 Wiki**：读取 `references/Migration-From-Education-Wiki.md`，先输出映射，不批量改名或搬移已有文件。
- **Obsidian 专属操作**：只有需要 Bases、CLI、原生 vault 操作或附件语义时才读取 `references/Obsidian-Skill-Dependency.md`；缺依赖时先确认安装来源和目标目录。

## Link-integrity loop

在创建、移动、重命名、归档或删除页面后：

1. 扫描受影响的 `[[wikilinks]]` 与 `![[embeds]]`。
2. 忽略别名 `|` 和 heading/block fragment `#` 后解析真实目标。
3. 修复双向受影响链接；不创建空占位页来掩盖断链。
4. 重新扫描；仍有歧义时报告精确路径和所需用户决定，不宣称完全成功。

## Guardrails

- 不改写已有 `100-Raw` 正文；来源变化时建立新 dated snapshot。
- 不为一带而过的提及建页，不为普通问答创建 Output。
- 不静默覆盖冲突观点；记录双方来源、日期、confidence 与 contested 状态。
- 单次入库会更新超过 10 个既有页面时先确认。
- 每次 material write 同步 index 与 append-only log；日志超过 500 条按年份轮转。
- 不在 Skill 文件中写死用户机器路径、token、私有端点或 K12 学生资料。

## 资源

- `references/Wiki-Architecture.md`：四层结构与 SCHEMA 契约。
- `references/Operations.md`：初始化、入库、查询、批量、归档流程。
- `references/Lint-Rules.md`：Wiki 健康检查。
- `references/Agents-Template.md`、`Index-Template.md`、`Log-Template.md`：控制文件模板。
- `references/Obsidian-Skill-Dependency.md`：需确认的 Obsidian adapter 安装流程。
- `references/Migration-From-Education-Wiki.md`：旧三层教育 Wiki 到四层结构的增量迁移。
