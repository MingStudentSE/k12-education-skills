# 教育资料编译工作流

本文件用于把 `100-Raw` 中的资料编译进 `200-Wiki`，并把交付成果放入 `300-Output`。

## 编译总流程

1. **确认来源**：记录原始路径、资料类型、日期、学科和用户意图。
2. **保留证据**：不改写原始资料；如需 OCR 修正，另存整理版并标注。
3. **提取核心**：提炼不超过 3 条核心结论、关键证据和待确认点。
4. **教育化判断**：判断它贡献的是知识点、错因、方法、学习画像、项目主题还是输出成果。
5. **写入 wiki**：更新对应页面，补充来源、相关链接和冲突标记。
6. **更新索引日志**：同步更新 `200-Wiki/00-索引与日志/index.md`、`log.md` 和必要的 `source-map.md`。
7. **回填输出价值**：如果某次回答或报告有长期价值，抽出稳定结论回填到 `200-Wiki`。

## 原始资料到页面类型

| 原始资料 | 主要 wiki 产物 | 可联动 Skill |
| --- | --- | --- |
| 错题照片、原答案、草稿 | 错题卡、错因模式、薄弱点、同类题验证记录 | `correction-notebook`、学科错误 DNA |
| 课堂笔记、板书、教材页 | 学科知识页、康奈尔笔记、自测问题、概念页 | `cornell-notes`、学科专项 |
| 作业、考试、测验 | 阶段弱项、题型分布、复习建议、阶段报告素材 | `weekly-review`、`learning-360-review` |
| 每日学习记录 | 学习节奏、专注证据、计划偏差、复盘素材 | `time-focus-coach`、`weekly-review` |
| 学生口述或反馈 | 经确认的学习画像线索、情绪/动机概括、待验证假设 | `learning-dna` |
| 文章、PDF、题集 | 摘要、概念、方法、主题页、资料来源索引 | 按主题选择 |
| 项目或兴趣资料 | 项目页、兴趣假设、探索记录、展示作品 | `interest-explorer`、`cross-subject-detective` |

## 页面最低结构

### 摘要页

```md
---
type: summary
subject:
status: compiled
source:
created:
updated:
---

# 标题

## 来源

## 核心结论

## 关键证据

## 学习意义

## 相关链接

## 待确认问题
```

### 概念页

```md
---
type: concept
subject:
status: compiled
source:
created:
updated:
---

# 概念名

## 一句话定义

## 学生容易卡住的点

## 例子与反例

## 与旧知识的连接

## 相关错因

## 来源
```

### 错因模式页

```md
---
type: wrong-answer-pattern
subject:
status: compiled
source:
created:
updated:
review_due:
---

# 错因模式名

## 现象

## 根因假设

## 证据

## 再犯预警

## 修正动作

## 同类题验证

## 相关知识点
```

### 方法页

```md
---
type: method
subject: general
status: compiled
source:
created:
updated:
---

# 方法名

## 适用场景

## 输入

## 步骤

## 学习区校准

## 常见失败方式

## 复测方式
```

### 输出页

```md
---
type: output
subject:
status: compiled
skill:
source:
created:
review_due:
---

# 输出标题

## 目标读者

## 使用场景

## 正文

## 后续动作

## 可沉淀回 Wiki 的结论
```

## 索引与日志要求

`index.md` 面向查找，记录页面入口和一句话说明。

建议结构：

```md
# Wiki Index

## 学习画像

## 学科知识

## 错因模式

## 学习方法

## 输出成果
```

`log.md` 面向时间线，采用可 grep 的标题。

```md
## [YYYY-MM-DD] compile | 原始文件名

- Source:
- Updated:
- Notes:
```

`source-map.md` 记录原始资料和编译页关系。

```md
| Source | Wiki pages | Output pages | Status |
| --- | --- | --- | --- |
```

## 编译质量检查

- 是否保留了原始来源路径？
- 是否把“事实、推断、建议”分开写？
- 是否记录证据不足或需要学生确认的地方？
- 是否更新了索引和日志？
- 是否避免了未授权长期画像、提醒或跨 Skill 共享？
- 是否把一次性输出和长期 wiki 知识分开放置？
