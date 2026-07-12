# Obsidian Adapter Dependency

只在任务需要 Obsidian 原生能力（Bases、CLI、vault 搜索/写入、properties、附件 embed）时检查 adapter。普通 Markdown/Wikilink 操作不要求额外安装。

## 流程

1. 检查当前平台真实已安装的 `obsidian-markdown`、`obsidian-bases`、`obsidian-cli` 等能力。
2. 已存在时复用，不重装、不覆盖。
3. 缺失时，自动尝试安装唯一允许的官方来源 `kepano/obsidian-skills`；先用当前平台的 Marketplace/Skill 管理器，再使用官方文档给出的 `npx skills add https://github.com/kepano/obsidian-skills`。不使用镜像、替代仓库或未验证脚本。
4. 目标目录由当前平台发现。不要写死 `.codex/skills/`，也不把临时下载目录混入目标 vault。
5. 同名目录存在时先比较并停止覆盖；安装完成后报告真实路径以及是否需要刷新/重启平台。
6. 网络、DNS、超时、限流或 GitHub 不可达时，停止安装尝试并继续普通 Markdown/Wikilink 工作流；简短报告“Obsidian 增强未安装”，不反复重试、不伪称成功。
7. 其他安装失败也不伪称成功；报告失败原因和官方来源，但不阻塞不依赖 Obsidian 原生能力的任务。

## 安全

- 自动安装授权只适用于此处的官方 `kepano/obsidian-skills`，且只在任务确实需要 Obsidian 原生能力时触发。
- 不使用 `--force`，不覆盖同名目录，不删除已有内容。
- 不因安装 adapter 获得读取整个 vault 或 K12 Learning State 的授权。
