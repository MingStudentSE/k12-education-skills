# AI × Obsidian 接入手册

## 推荐组合

- `k12-learning`：完成学习任务，默认只在当前会话工作。
- `llm-wiki`：负责 Obsidian/Markdown vault 的结构、入库、查询和审计。
- `k12-automation`：仅在需要提醒、OCR、夜间处理或看板时安装。

不要把 58 个学习 playbook 单独安装到 Obsidian。它们由 `k12-learning` 内部按需读取。

## 接入已有 vault

向 AI 提供绝对路径并说：

```text
使用 llm-wiki 适配这个 Obsidian vault：/绝对路径。
先读取已有 AGENTS.md 和目录规则，判断当前结构；先给增量映射和预计变更清单，不覆盖、不搬空旧笔记，等我确认后再写。
```

检查顺序：

1. 找 `AGENTS.md`、现有 schema/index/log 和 Obsidian 配置。
2. 识别已有目录用途、命名、frontmatter、附件位置和链接风格。
3. 输出到四层语义的增量映射；已有目录可以保留，不要求一次性搬迁。
4. 确认后补充缺失控制文件，并对小批文件试运行。
5. 复扫链接、索引、日志和来源；报告未解决歧义。

## 建立新 vault

```text
使用 llm-wiki 在 /绝对路径 建立一个新的学习 Wiki。
采用 100-Raw、200-Wiki、300-Output、999-Assets 四层；创建前列出路径，确认后再写。
```

四层含义：

- `100-Raw`：来源快照，正文不可改写。
- `200-Wiki`：概念、方法、错因等编译知识；含 `SCHEMA.md`、`index.md`、`log.md`。
- `300-Output`：可复用的专题总结、复盘、课程或分享稿。
- `999-Assets`：非 Markdown 附件。

## 从学习会话沉淀

先在 `k12-learning` 中完成理解和验证，再明确选择需要保存的内容：

```text
把刚才已经确认的“二次函数配方法错因”和复测结论写入 /绝对路径。
只传本次任务必要的最小摘要；写入前展示目标文件和字段。
```

会话结果不会因为“有 Wiki”就自动保存。学习 DNA、错因档案和复盘等长期状态必须先说明字段、用途、位置和删除方式。

## 资料入库

```text
把这份资料收入 /绝对路径。先保存来源快照，再编译有持续价值的概念和方法；正文 hash 相同则跳过。更新 index 和 log，并报告来源冲突与断链。
```

图片、PDF 或音频放在 `999-Assets`，可提取文本作为新的 `100-Raw` 来源，但不能用摘要替换原始快照。

## Obsidian 专属能力

只有在需要 Bases、Obsidian CLI、vault 命令或附件语义时才检查额外 Obsidian skills。`llm-wiki` 会先检查现有能力；缺失时自动尝试安装官方 `kepano/obsidian-skills`，不覆盖已有同名目录。网络失败时回退到普通 Markdown 操作并如实说明未安装，不阻塞当前任务。

## 安全检查

- vault 中不要保存 API key、私有端点或真实联系方式。
- 未成年人数据只保留学习任务必需的低敏摘要。
- 批量改名、移动、归档、删除或单次更新超过 10 个既有页面时再次确认。
- 写入后检查 wikilink/embed、index 和 append-only log。
- 同步服务、Git 和云盘各自有独立的数据边界；本地写入授权不等于同意云端外传。

可复制的 vault 规则见 [`AGENTS.k12-learning-vault.template.md`](AGENTS.k12-learning-vault.template.md)。
