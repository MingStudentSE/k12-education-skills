# 学习DNA · JSON Schema

本目录包含学习DNA的正式数据结构定义。

## 文件说明

| 文件 | 说明 |
|------|------|
| `dna-profile.schema.json` | 学习DNA完整 JSON Schema（draft 2020-12） |
| `examples/full-profile.example.json` | v1.3 完整档案示例（覆盖所有维度、三档掌握层级和四类概念关系，仅写入 `conceptGraph`） |
| `examples/legacy-profile-v1.2.example.json` | v1.2 兼容读取示例（仅覆盖已废弃的 `knowledgeAccumulationTree`） |
| `validate.js` | ajv 验证脚本（测试 schema 自身有效性 + 示例数据合规性） |

## 结构覆盖

Schema 覆盖以下所有维度，与 `playbook.md` 中的字段定义一一对应：

**六大基础维度：**
1. `meta` — 档案元数据（版本、授权状态）
2. `basicInfo` — 基础信息（年级、目标、可用时间）
3. `subjectMap` — 学科强弱地图（强项/弱项/薄弱知识点清单）
4. `learningStyle` — 学习风格偏好（解释方式/对话节奏/注意力习惯）
5. `errorPatterns` — 错误模式记录（固定错误类型/根因分析/已攻克）
6. `conversationSummary` — 对话历史摘要（本周重点/未解决疑问/学习节点）
7. `growthTrack` — 成长轨迹（里程碑/持续进步/飞轮状态）

**v1.1–v1.3 扩展维度：**
8. `growthMap` — 成长图谱（错题地图/口语轨迹/弱项突破/实体—关系概念图谱）
9. `interestDNA` — 兴趣DNA（探索领域/挑战反应/浅层喜好/真正兴趣）

### conceptGraph（v1.3）

- `nodes` 保存低敏课程概念，掌握层级只使用 `会复述`、`会解释`、`真正掌握`。
- `edges` 使用 `sourceNodeId → targetNodeId` 表达有向关系；关系类型只使用 `requires`、`isParentOf`、`appliesTo`、`correlatesWith`。
- v1.3 档案只有在 `profileEnabled=true` 时才允许携带 `conceptGraph`；会话内未授权草稿不要写入此长期档案结构。
- `nodeId` 必须是档案内唯一的非身份化短 ID；每条边必须引用同一图谱中已存在的节点。JSON Schema 能约束 ID 格式，节点唯一性和边引用完整性必须由写入方调用同等保存前校验；仓库回归包含重复 ID 与悬空边负例。
- `knowledgeAccumulationTree` 仅保留用于读取和迁移 v1.2.0 及更早档案，已标记为 `deprecated`、`readOnly`。Schema 禁止 v1.3 双写旧树，也禁止 v1.2 及更早档案携带新图；向后兼容由独立的 v1.2 fixture 验证。

## 设计原则

- **所有字段均为可选（optional）**：仅 `meta` 为必填，其余按需记录，遵循"最小必要"原则
- **枚举约束**：状态、类别等字段使用 `enum` 约束，确保数据一致性
- **置信度标签**：`confidenceLevel` 贯穿多个维度，统一使用 `$defs/confidenceLevel` 定义
- **隐私边界**：Schema 中不含任何高敏感字段（住址/电话/证件等），与 `SECURITY_BASELINE.md` 一致
- **字段硬约束**：概念名、学科和节点 ID 均设置长度或格式上限；不得把真实姓名、学校全称、身份证件、联系方式、账户信息、医疗诊断、心理标签、家庭纠纷或财务细节塞入节点或边
- **错误码命名空间**：`errorPatterns.fixedErrorTypes` 的学科专属主/关联类型一旦持久化，必须使用 `math:C01`、`physics:C01` 等规范 ID；局部短码只允许在学科内部参考表中展示

## 运行验证

```bash
# 在仓库根目录安装 Python 依赖
python3 -m pip install -r pipeline/requirements.txt

# 编译全部 Schema，并验证 Learning DNA 完整示例
python3 pipeline/validate_schemas.py
```

预期输出：
```
schema validation: 4 modules; ...; intake + DNA + 9 curriculum profiles + curriculum output valid
```
