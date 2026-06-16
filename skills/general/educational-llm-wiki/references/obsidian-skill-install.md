# Obsidian Skills 检查与安装

本文件用于在教育 LLM Wiki 接入 Obsidian 时检查并安装官方 Obsidian skills。

官方仓库：

- `https://github.com/kepano/obsidian-skills`

## 官方仓库包含的 skills

截至 2026-06-14，官方 README 列出的 skills 包括：

- `obsidian-markdown`：创建和编辑 Obsidian Flavored Markdown，支持 wikilinks、embeds、callouts、properties 等。
- `obsidian-bases`：创建和编辑 Obsidian Bases `.base` 文件。
- `json-canvas`：创建和编辑 JSON Canvas `.canvas` 文件。
- `obsidian-cli`：通过 Obsidian CLI 操作 vault、插件和主题。
- `defuddle`：把网页提取为干净 Markdown，适合资料入库前清理。

## 什么时候检查

在以下场景先检查 Obsidian skills 是否已安装：

- 用户要求适配 Obsidian vault。
- 需要写 Obsidian wikilinks、properties、callouts、embeds。
- 需要创建 `.base` 或 `.canvas` 文件。
- 需要通过 Obsidian CLI 搜索、读写、调试 vault。
- 需要把网页清理成 Markdown 放入 `100-Raw`。
- 用户明确说“没有安装 Obsidian skill 就帮我安装”。

## 检查路径

按目标环境查找，优先项目级，再看用户级：

```text
./.agents/skills/
./.claude/skills/
~/.agents/skills/
~/.claude/skills/
~/.opencode/skills/obsidian-skills/skills/
```

检查这些目录下是否存在：

```text
obsidian-markdown/SKILL.md
obsidian-bases/SKILL.md
json-canvas/SKILL.md
obsidian-cli/SKILL.md
defuddle/SKILL.md
```

如果当前平台有自己的 skill 管理器或 Marketplace，优先使用平台推荐路径。

## 安装方式

### Marketplace

若当前 Agent 支持插件 Marketplace，可使用官方 README 提供的命令：

```bash
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

### npx skills

若环境支持 `npx skills`：

```bash
npx skills add https://github.com/kepano/obsidian-skills
```

官方 README 也给出 SSH 形式：

```bash
npx skills add git@github.com:kepano/obsidian-skills.git
```

### 手动安装到 Codex

Codex 场景可先克隆到临时目录，再把官方 `skills/` 下需要的子目录复制到 Codex skills 路径。

```bash
git clone https://github.com/kepano/obsidian-skills.git /tmp/obsidian-skills
mkdir -p ~/.agents/skills
cp -R /tmp/obsidian-skills/skills/obsidian-markdown ~/.agents/skills/
cp -R /tmp/obsidian-skills/skills/obsidian-bases ~/.agents/skills/
cp -R /tmp/obsidian-skills/skills/obsidian-cli ~/.agents/skills/
cp -R /tmp/obsidian-skills/skills/json-canvas ~/.agents/skills/
cp -R /tmp/obsidian-skills/skills/defuddle ~/.agents/skills/
```

如果目标是项目级安装，把 `~/.agents/skills` 替换为 `./.agents/skills`。

### 手动安装到 Claude Code

Claude Code 场景可将仓库内容放入目标 Obsidian vault 根目录的 `/.claude` 文件夹，或按项目约定把官方 `skills/` 子目录复制到 `./.claude/skills/`。

### 手动安装到 OpenCode

OpenCode 场景官方 README 建议克隆完整仓库：

```bash
git clone https://github.com/kepano/obsidian-skills.git ~/.opencode/skills/obsidian-skills
```

不要只复制内层 `skills/`，保持结构为：

```text
~/.opencode/skills/obsidian-skills/skills/<skill-name>/SKILL.md
```

## 安全安装规则

- 安装前确认目标 skill 目录。
- 只安装缺失的 Obsidian skills。
- 如目标目录已有同名 skill，先比较，不覆盖。
- 不删除用户已有 skills。
- 不把官方仓库整体混入当前 K12 skill 仓库。
- 安装后提示用户重启或刷新对应 Agent，让新 skills 被发现。
