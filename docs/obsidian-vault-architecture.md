# Obsidian 学习 Wiki 架构

本仓库使用 `llm-wiki` 管理 Obsidian 或普通 Markdown 知识库。规范结构为四层：

```text
vault/
├── AGENTS.md
├── 100-Raw/
├── 200-Wiki/
│   ├── SCHEMA.md
│   ├── index.md
│   └── log.md
├── 300-Output/
└── 999-Assets/
```

## 分层职责

| 层 | 保存什么 | 不保存什么 |
|---|---|---|
| `100-Raw` | 带来源、日期和 hash 的不可改写快照 | AI 改写后的“原文”、无来源结论 |
| `200-Wiki` | 有持续价值的概念、方法、错因、人物和关系 | 一次性问答、未经证实的学生标签 |
| `300-Output` | 专题总结、课程、复盘、分享稿等昂贵综合 | 每次聊天回复 |
| `999-Assets` | PDF、图片、音频和其他二进制附件 | 用附件代替可检索的知识页 |

`200-Wiki/SCHEMA.md` 统一领域目录、文件命名、frontmatter、tag taxonomy、页面创建阈值和更新策略。`AGENTS.md` 只描述操作与安全约束，并指向 SCHEMA。

## K12 内容建议

具体领域可在 SCHEMA 中定义，例如：

```text
200-Wiki/
├── concepts/
├── methods/
├── error-patterns/
├── projects/
└── reviews/
```

这是示例而非第二套硬编码 taxonomy。已有 vault 应先映射现有结构，不强制搬成上述目录。

学习会话与 Wiki 的关系：

1. `k12-learning` 在会话内完成解释、练习和验证。
2. 用户选择值得长期保存的最小内容。
3. `llm-wiki` 依据 SCHEMA 写入并更新 index/log。
4. 需要提醒或批处理时才由 `k12-automation` 读取经授权的必要数据。

## Link-integrity loop

页面创建、移动、重命名、归档或删除后：

1. 扫描受影响的 `[[wikilinks]]` 和 `![[embeds]]`。
2. 去除别名与 heading/block fragment 后解析真实目标。
3. 修复双向影响，不用空占位页掩盖断链。
4. 再扫描并报告仍有歧义的精确路径。

## 迁移已有三层教育库

不做一次性“搬空重建”。先建立语义映射：

- 旧原始资料 → `100-Raw` 或保留原目录并在 SCHEMA 声明等价层；
- 旧知识卡片 → `200-Wiki`；
- 旧成品 → `300-Output`；
- 旧附件 → `999-Assets` 或保留已有附件目录映射。

先选一小批文件试迁移，验证链接、frontmatter、index、log 与回滚方式，再扩大范围。

## 安全边界

- 不因接入 vault 自动建立学生长期档案。
- 不记录真实住址、联系方式、证件、医疗、财务和无关家庭细节。
- 单次错误不能直接成为“错误 DNA”；需要多次证据或用户确认。
- 批量迁移、删除或大范围重写前必须确认。只有任务确实需要 Obsidian 原生能力时，可自动尝试官方 `kepano/obsidian-skills`；网络失败则降级，不覆盖已有目录。
- 本地写入授权不等于云同步、外部模型或家长共享授权。

操作话术见 [`AI-obsidian-integration-manual.md`](AI-obsidian-integration-manual.md)，可复制规则见 [`AGENTS.k12-learning-vault.template.md`](AGENTS.k12-learning-vault.template.md)。
