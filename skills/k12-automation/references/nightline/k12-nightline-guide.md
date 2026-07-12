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

## 2. 建立数据根与运行对象

```bash
mkdir -p ~/k12-data/students
cd ~/k12-data
K12_ROOT="$HOME/k12-data" K12_MOCK_LLM=1 \
node ~/.codex/skills/k12-automation/scripts/nightline/server.mjs
```

浏览器打开 `http://127.0.0.1:18350`，用“注册运行对象”建立低敏学生 ID 与授权。该操作只创建 `students/<id>/automation/state.json` 和 inbox/archive/outbox，不创建姓名、年级或任意学习画像。

Learning State 仍由 `k12-learning` 拥有。Automation steady-state runtime 完全不读取 `profile.md`，授权只来自通过 schema 的 `automation/state.json`。若确有旧授权数据，由维护者先执行下面的一次性迁移；外部处理不会随迁移继承，必须重新授权。未来若要传递学习摘要，必须由 Learning 显式产出版本化 adapter input。

```bash
K12_ROOT="$HOME/k12-data" \
node ~/.codex/skills/k12-automation/scripts/nightline/migrate-legacy-authorization.mjs --audit

K12_ROOT="$HOME/k12-data" \
node ~/.codex/skills/k12-automation/scripts/nightline/migrate-legacy-authorization.mjs --student stu-001 --confirm
```

正常的 server、night-run 和 dashboard 都不会调用迁移脚本，也不会把旧 profile 当作 fallback。

## 3. 授权

本地运行授权写入 `automation/state.json`，建议通过控制台完成。核心记录为：

```json
{
  "local": {
    "authorized": true,
    "authorized_by": "监护人，2026-07-11，电子确认（仅本地处理）",
    "subject": "guardian",
    "date": "2026-07-11",
    "method": "digital",
    "action": "create"
  }
}
```

也可通过本地控制台完成。主体仅可为 `student|guardian`，方式仅可为 `written|verbal|digital`，日期不能在未来。

真实模型另需独立授权，同样记录在 `automation/state.json`：

```json
{
  "external_processing": {
    "authorized": true,
    "provider": "https://api.example.com",
    "scope": "current-mistake,recent-3-archives",
    "date": "2026-07-11"
  }
}
```

provider 必须与 `apibase` 的 origin 一致；scope 必须原样填写。旧的 `profile-summary,...` scope 不再接受，升级后需重新确认外部授权。Mock 不外传。OCR 每次上传仍需单独确认，不能由以上授权自动覆盖。

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
  "learningAdapter": "/Users/you/.codex/skills/k12-learning/references/adapters/night-analysis-v1.md"
}
```

不要提交此文件。通常无需填写 `learningAdapter`，相邻安装会自动找到固定的 v1 契约；非相邻安装可用 `K12_LEARNING_ADAPTER` 覆盖。它必须指向受支持的版本化契约文件，不能指向 playbook 目录；adapter 声明的 request/output schema 也必须与它一同安装，否则 Mock 和真实运行都会失败关闭。

## 5. 先做 Mock 验证

在 `students/stu-001/inbox/` 保留一份错题 Markdown，然后运行：

```bash
cd ~/k12-data
K12_ROOT="$HOME/k12-data" \
K12_LEARNING_ADAPTER="$HOME/.codex/skills/k12-learning/references/adapters/night-analysis-v1.md" \
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
K12_LEARNING_ADAPTER="$HOME/.codex/skills/k12-learning/references/adapters/night-analysis-v1.md" \
node ~/.codex/skills/k12-automation/scripts/nightline/server.mjs
```

浏览器打开 `http://127.0.0.1:18350`。控制台可建学生、更新授权、提交错题、运行分析和查看产出。OCR 最多 6 张；必须使用视觉模型、每次确认外传并人工核对转写。

## 8. 定时运行

定时任务使用绝对路径，并把数据根与时区写清楚：

```cron
30 1 * * * cd /Users/you/k12-data && K12_ROOT=/Users/you/k12-data K12_LEARNING_ADAPTER=/Users/you/.codex/skills/k12-learning/references/adapters/night-analysis-v1.md K12_TIME_ZONE=Asia/Shanghai node /Users/you/.codex/skills/k12-automation/scripts/nightline/night-run.mjs >> /Users/you/k12-data/logs/cron.log 2>&1
```

先手动通过 Mock 和真实单学生运行，再启用 cron。

## 9. 撤回与清理

- 撤回外部处理：在控制台选择“仅撤回外部处理”；本地运行授权可保留。
- 撤回本地处理：在控制台选择“撤回本地及外部处理”；后续读取、写入与分析必须停止。
- 删除、导出或保留 profile、archive、outbox、dashboard 和日志是独立决定，不因撤回自动删除。
- API key、真实学生数据、日志、看板和授权记录不得进入版本库。

仓库维护者的路径与回归说明见 [运行时契约](k12-nightline-contract.md)。
