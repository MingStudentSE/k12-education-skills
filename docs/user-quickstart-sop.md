# 四模块用户快速上手 SOP

> 适用版本：**V3.0**。目标：第一次使用者在 10 分钟内完成安装、验证和第一次真实学习任务。

## A. 安装前检查

在仓库根目录执行：

```bash
test -f skills/k12-learning/SKILL.md && echo "SOURCE_OK"
find skills -name SKILL.md -print
```

验收：看到 `SOURCE_OK`，并且只列出 `k12-learning`、`llm-wiki`、`k12-automation`、`k12-skill-studio` 四个入口。

## B. 安装普通用户套装

```bash
mkdir -p ~/.codex/skills
cp -R skills/k12-learning ~/.codex/skills/
cp -R skills/llm-wiki ~/.codex/skills/
```

如果目标目录已有同名模块，先备份再替换，不要把新旧文件混合覆盖。刷新或重启 Codex。

验收：

```bash
test -f ~/.codex/skills/k12-learning/SKILL.md
test -f ~/.codex/skills/k12-learning/references/capability-map.json
test -f ~/.codex/skills/llm-wiki/SKILL.md
echo "INSTALL_OK"
```

## C. 第一次学习任务

复制这句话，并把题目或过程一起发出：

```text
这是我做错的一道题。先复述已知条件，指出我第一处卡点；先给一级提示，不要直接给完整答案。最后用一道变式题验证我是否会了。
```

验收：系统应直接处理问题，不要求你从几十个 Skill 名称中选择；应先依据你的步骤定位卡点，再逐级提示和复测。

以下通用能力也直接自然表达：

- “用费曼方法追问我这个概念。”
- “我总犯同类错误，帮我找错误 DNA；没有足够证据就别下长期结论。”
- “用理科四步法带我做，但先不公布答案。”
- “给我设计一周跨学科侦探任务。”
- “三周后考试，先制定计划；我已有计划但总拖延，重点解决执行。”

验收：这些都是 `k12-learning` 内部能力，不需要额外安装。

## D. 建立或接入 Wiki（可选）

准备一个空目录或已有 Markdown/Obsidian vault，然后说：

```text
使用 llm-wiki 适配这个目录：/绝对路径。先判断现状并列出计划，不覆盖或搬空已有文件；首次写入前等我确认。
```

空库确认后将采用：

```text
100-Raw/
200-Wiki/
300-Output/
999-Assets/
```

验收：已有库先读取本地规则并输出增量映射；新库在确认后创建四层和控制文件。任何批量迁移、删除或依赖安装都要再次确认。

把学习结果沉淀进去时说：

```text
把刚才已经确认的错因和方法写入我的 Wiki。只传这次任务所需的最小内容，写入前展示文件清单。
```

## E. 安装自动化（仅在需要时）

```bash
cp -R skills/k12-automation ~/.codex/skills/
mkdir -p ~/k12-data
cd ~/k12-data
mkdir -p students
cp -R ~/.codex/skills/k12-automation/assets/student-template students/stu-001
cp ~/.codex/skills/k12-automation/scripts/nightline/config.sample.json \
  ~/.codex/skills/k12-automation/scripts/nightline/config.json
```

先打开 `config.json` 检查 endpoint、model 和业务时区。API key 只保存在本机；不要提交配置、真实学生数据、日志或看板。

首次用 mock 验证：

```bash
K12_ROOT="$HOME/k12-data" \
K12_LEARNING_DIR="$HOME/.codex/skills/k12-learning" \
K12_MOCK_LLM=1 \
node ~/.codex/skills/k12-automation/scripts/nightline/night-run.mjs --student stu-001
```

若模板学生 ID 不是 `stu-001`，先按模板复制/重命名并完成授权字段。真实运行前分别确认：本地建档授权、外部模型提供方与数据范围；OCR 图片每次单独确认。

启动本地控制台：

```bash
cd ~/k12-data
node ~/.codex/skills/k12-automation/scripts/nightline/server.mjs
```

验收：服务只监听 `127.0.0.1`。没有授权或配置不完整时应拒绝执行，而不是静默放行。

## F. 日常操作口令

- 查看/更正/删除长期状态：“查看我的学习档案”“更正……”“删除我的档案”。
- 会话不留存：“这次只在当前会话使用，不要保存。”
- 提醒控制：“查看提醒”“暂停提醒”“恢复提醒”“取消提醒”。
- Wiki 写入控制：“先预览变更”“这次不要写入”“撤销本次新增文件”。
- 路由解释：“刚才用了哪些内部方法，为什么？”

## G. 故障排查

| 现象 | 检查与处理 |
|---|---|
| 宿主仍显示几十个 Skill | 移走旧平级 Skill 目录，只保留四模块；刷新宿主 |
| 只复制了 `SKILL.md` 后能力缺失 | 重新复制整个模块目录，保留 references/schemas/scripts/assets |
| 学习请求被要求选 Skill | 明确使用 `k12-learning`；检查是否装的是旧 router 版本 |
| Wiki 要覆盖旧目录 | 停止写入，要求先读本地规则并输出增量映射 |
| 提醒说成功但没有任务 ID | 视为未创建；检查宿主是否有真实调度 adapter |
| 夜跑找不到 playbook | 设置 `K12_LEARNING_DIR` 为已安装的 `k12-learning` 绝对路径 |
| 夜跑无授权仍继续 | 立即停止，保留证据并运行仓库 `bash pipeline/review.sh all` |

## H. 完成标准

满足以下条件即可投入日常使用：

- 宿主只暴露需要的 Product Module，不暴露内部 playbook。
- 一条自然语言学习请求可直接得到学科处理、提示阶梯和复测。
- 未确认时不建档、不写 Wiki、不提醒、不外传。
- 可选自动化先通过 mock，且真实运行有独立授权和可撤回入口。

维护者再安装 `k12-skill-studio`，并以 `bash pipeline/review.sh all` 作为发布前最低质量门。
