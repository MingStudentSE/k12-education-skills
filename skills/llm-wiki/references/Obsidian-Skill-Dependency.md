# Obsidian Adapter Dependency

只在任务需要 Obsidian 原生能力（Bases、CLI、vault 搜索/写入、properties、附件 embed）时检查 adapter。普通 Markdown/Wikilink 操作不要求额外安装。

## 流程

1. 检查当前平台真实已安装的 `obsidian-markdown`、`obsidian-bases`、`obsidian-cli` 等能力。
2. 已存在时复用，不重装、不覆盖。
3. 缺失时向用户展示：需要的能力、官方来源、目标安装目录、将新增的目录；等待明确同意。
4. 获得同意后优先使用平台 Skill 管理器或官方 Marketplace；其次使用 `npx skills add https://github.com/kepano/obsidian-skills`；最后才手动复制。
5. 目标目录由当前平台发现：Codex 项目级通常为 `.agents/skills/`，Claude Code 为 `.claude/skills/`。不要写死 `.codex/skills/`。
6. 同名目录存在时先比较并停止覆盖；安装完成后列出真实路径并要求刷新/重启平台。
7. 无法安装时说明具体失败原因和手动来源，不伪称成功。

## 安全

- 未获确认不得执行 `npx`、`git clone`、复制或删除。
- 不把临时下载目录混入目标 vault。
- 不因安装 adapter 获得读取整个 vault 或 K12 Learning State 的授权。
