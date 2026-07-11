# K12 自动化与夜间错题产线指南

运行时随 `k12-automation` 模块安装，学生数据位于独立数据根。以下示例假设：

```text
模块：~/.codex/skills/k12-automation
学习模块：~/.codex/skills/k12-learning
数据根：~/k12-data
```

## 1. 环境

- Node.js 18 或更高版本；
- `k12-learning` 与 `k12-automation` 均已完整安装；
- 服务只在本机使用，不直接暴露公网；
- 真实模型需要 OpenAI 兼容 endpoint、key 和 model。

## 2. 建立数据根

```bash
mkdir -p ~/k12-data/students
cp -R ~/.codex/skills/k12-automation/assets/student-template \
  ~/k12-data/students/stu-001
```

将 `students/stu-001/profile.md` 中的 `id` 改为 `stu-001`。模板默认 `authorized: false`，这是正确状态。

## 3. 授权

本地长期档案需要同时填写：

```yaml
authorized: true
authorized_by: 监护人电子确认
authorization_subject: guardian
authorization_date: 2026-07-11
authorization_method: digital
```

也可通过本地控制台完成。主体仅可为 `student|guardian`，方式仅可为 `written|verbal|digital`，日期不能在未来。

真实模型另需独立授权：

```yaml
external_processing_authorized: true
external_processing_provider: https://api.example.com
external_processing_scope: profile-summary,current-mistake,recent-3-archives
external_processing_authorization_date: 2026-07-11
```

provider 必须与 `apibase` 的 origin 一致；scope 必须原样填写。Mock 不外传。OCR 每次上传仍需单独确认，不能由以上授权自动覆盖。

## 4. 配置

```bash
cp ~/.codex/skills/k12-automation/scripts/nightline/config.sample.json \
  ~/.codex/skills/k12-automation/scripts/nightline/config.json
```

编辑 `config.json`：

```json
{
  "apibase": "https://api.example.com/v1",
  "key": "本机密钥",
  "model": "支持的模型名",
  "learningDir": "/Users/you/.codex/skills/k12-learning"
}
```

不要提交此文件。也可以用 `K12_LEARNING_DIR` 覆盖 `learningDir`。

## 5. 先做 Mock 验证

在 `students/stu-001/inbox/` 保留一份错题 Markdown，然后运行：

```bash
cd ~/k12-data
K12_ROOT="$HOME/k12-data" \
K12_LEARNING_DIR="$HOME/.codex/skills/k12-learning" \
K12_MOCK_LLM=1 \
node ~/.codex/skills/k12-automation/scripts/nightline/night-run.mjs --student stu-001
```

验收：命令为零退出；原错题进入 processed；outbox、archive 和 logs 出现对应产物。若失败，错题应留在 inbox，不能汇报成功。

## 6. 真实运行与看板

```bash
cd ~/k12-data
K12_ROOT="$HOME/k12-data" \
node ~/.codex/skills/k12-automation/scripts/nightline/night-run.mjs --student stu-001

K12_ROOT="$HOME/k12-data" \
node ~/.codex/skills/k12-automation/scripts/nightline/build-dashboard.mjs
```

不带 `--student` 会处理全部有效学生。`--student` 缺值、ID 非法或学生不存在会直接失败，不会回退为全员。

## 7. 本地控制台和 OCR

```bash
cd ~/k12-data
K12_ROOT="$HOME/k12-data" \
K12_LEARNING_DIR="$HOME/.codex/skills/k12-learning" \
node ~/.codex/skills/k12-automation/scripts/nightline/server.mjs
```

浏览器打开 `http://127.0.0.1:18350`。控制台可建学生、更新授权、提交错题、运行分析和查看产出。OCR 最多 6 张；必须使用视觉模型、每次确认外传并人工核对转写。

## 8. 定时运行

定时任务使用绝对路径，并把数据根与时区写清楚：

```cron
30 1 * * * cd /Users/you/k12-data && K12_ROOT=/Users/you/k12-data K12_LEARNING_DIR=/Users/you/.codex/skills/k12-learning K12_TIME_ZONE=Asia/Shanghai node /Users/you/.codex/skills/k12-automation/scripts/nightline/night-run.mjs >> /Users/you/k12-data/logs/cron.log 2>&1
```

先手动通过 Mock 和真实单学生运行，再启用 cron。

## 9. 撤回与清理

- 撤回外部处理：将 `external_processing_authorized` 改为 `false`；本地档案可保留。
- 撤回本地建档：将 `authorized` 改为 `false`；后续分析必须停止。
- 删除、导出或保留 profile、archive、outbox、dashboard 和日志是独立决定，不因撤回自动删除。
- API key、真实学生数据、日志、看板和授权记录不得进入版本库。

仓库维护者的路径与回归说明见 [交接文档](k12-nightline-handover.md)。
