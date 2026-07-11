# 通用四维到物理五维映射表

> P0 专项：本文件集中保留通用错题本四维标签与物理错误 DNA 五维标签的非 1:1 映射，供物理错题交接前判定。

## 物理常见错误类型（通用层基础分类）

> 以下四维分类与错题本SKILL §3.3 四维错因分析严格对齐，是物理错题交接至物理错误DNA前的分类标准。
> 物理有五维分类（P类图景建立/C类概念混淆/F类公式误用/R类过程分析/T类数学工具），通用层四维→物理五维为非1:1映射，交接时需标注判断线索。

### 概念理解错误 → 交接标签：图景建立(P) 或 概念混淆(C)
- 没有画受力分析图/电路图就直接列公式（→ P类）
- 速度与加速度方向关系混淆（→ C类）
- 压强与压力混用（→ C类）
- 参考系选取错误（→ P类）

> 判断规则：若学生缺失"画图景"意识和习惯，归P类；若学生画了图但概念理解有偏差，归C类。

### 审题习惯问题 → 交接标签：图景建立(P) 或 概念混淆(C)
- 漏读"匀速""光滑"等物理条件词（→ P类，因为没建立正确图景）
- 未注意到"静止""匀速直线运动"隐含合力为零（→ C类，概念理解偏差导致审题遗漏）
- 忽略图形中的隐含条件（→ P类）

> 判断规则：物理审题的核心是"将文字转化为图景"，审题遗漏常与图景缺失有关。

### 计算/操作失误 → 交接标签：数学工具错误(T)
- 单位换算出错（km/h→m/s）
- 比例运算出错
- 图像读取错误（坐标轴含义、斜率/截距）

### 策略选择错误 → 交接标签：公式误用(F) 或 过程分析错误(R)
- 知道公式但适用条件不满足仍套用（→ F类）
- 多阶段运动只分析一段（→ R类）
- 矢量方向没考虑（→ F类）
- 步骤顺序混乱导致结果错（→ R类）

> 判断规则：公式选错归F类，过程拆分不完整归R类。

> 🔗 **深度分类交接**：完成以上基础四维分类后，将判断线索和标签作为 `physicsBasicDimension` 字段推送给物理错误DNA。基因档案将基于此标签和判断线索进行子类型精确定位（如"图景建立(P)"→P03受力图遗漏摩擦力），详见 `物理错误DNA的内部维度表`。

---

## 物理交接数据格式中的映射要求

#### 9.3.2 交接数据格式 (强 Schema 绑定)

交接必须符合 `schemas/handover-protocol.schema.json` 规范。档案中"错误类型"字段值为 [概念/计算/审题/策略]，交接时需映射为 `physicsBasicDimension` 的标准值（通用四维→物理五维为非1:1映射）：

```text
档案标签 ➡️ 交接标签映射：
  概念 ➡️ 图景建立(P) 或 概念混淆(C)  [判断线索：是否缺失画图景习惯]
  计算 ➡️ 数学工具错误(T)
  审题 ➡️ 图景建立(P) 或 概念混淆(C)  [判断线索：审题遗漏是否与图景缺失有关]
  策略 ➡️ 公式误用(F) 或 过程分析错误(R)  [判断线索：公式选错归F，过程拆分不完整归R]
```

```json
{
  "sessionId": "session-{{uuid}}",
  "protocolVersion": "2.0.0",
  "handoverType": "wrong_answer_handover",
  "sender": "correction-notebook",
  "recipient": "physics-error-dna",
  "payload": {
    "wrongAnswerData": {
      "errorId": "err-{{id}}",
      "subject": "physics",
      "concept": "{{知识点名称}}",
      "handoverTrigger": "new_error",
      "basicDimension": "概念模糊",
      "physicsBasicDimension": "图景建立(P)",
      "judgmentClue": "{{判断线索说明（为何归P/C/F/R/T）}}",
      "surfaceInfo": {
        "questionAbstract": "{{题目简述}}",
        "studentAnswer": "{{学生原始答案}}",
        "correctAnswer": "{{正确答案}}",
        "surfaceRootCause": "{{初步判断的一句话表面根因}}"
      }
    }
  },
  "timestamp": "{{iso_timestamp}}"
}
```
*注：对于高度顽固物理错题触发，`handoverTrigger` 设为 `stubborn_weakness` 并附带 `historyRefs`（如 `["err-1", "err-2"]`）；若检测到学生流露物理焦虑，`handoverTrigger` 设为 `anxiety_trigger` 并附带 `anxietySignals`；judgmentClue 在 "new_error" 类型时必填，帮助物理错误DNA快速定位子类型。*
