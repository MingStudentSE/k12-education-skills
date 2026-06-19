# 画像交付模板

所有模板默认会话内使用；只有用户明确同意建档或共享时，才把最小摘要交给 `learning-dna` 或 `skill-coordinator`。

## 画像卡 Markdown 模板

```markdown
## 学生快速定位画像卡

### routingHints
- gradeLevel: {{学段年级}}（confidenceLevel: {{...}}）
- textbookVersion: {{教材版本/不确定}}（confidenceLevel: {{...}}）
- subjectSet: {{科目清单}}（每项标 confidenceLevel）
- trackOrCombination: {{初中全科/文理/3+1+2组合}}（confidenceLevel: {{...}}）
- recommendedNextSkills:
  - {{skill-name}}：{{理由}}

### evidenceInventory
- hasHomework: {{true/false/unknown}}（confidenceLevel: {{...}}）
- hasExams: {{true/false/unknown}}（confidenceLevel: {{...}}）
- hasErrorBook: {{true/false/unknown}}（confidenceLevel: {{...}}）
- format: {{拍照/文字/文件/暂无}}

### seedForDNA
- basicInfo: {{短期目标、考试节点、可用时间}}
- subjectMap: {{初步强项/弱项，全部低置信待验证}}
- learningStyle: {{讲解偏好、节奏偏好}}

### consentStatus
- profileEnabled: {{true/false}}
- memoryPaused: {{true/false}}
- crossSkillSharing: {{true/false}}
- reminderConsent: {{true/false}}
```

## 给 learning-dna 的种子

```json
{
  "basicInfo": {
    "gradeLevel": "高二",
    "shortTermGoal": "下次数学月考减少压轴题失分",
    "upcomingExams": [],
    "availableStudyTime": "每天晚间约40分钟"
  },
  "subjectMap": {
    "strengths": [],
    "weaknesses": [
      {
        "subject": "数学",
        "chapters": ["待由试卷确认"],
        "confidenceLevel": "insufficient_sample"
      }
    ]
  },
  "learningStyle": {
    "preferredExplanationMode": ["先拆题目结构", "再做变式验证"],
    "conversationPace": "快节奏，少讲大道理"
  }
}
```

交付条件：用户明确同意建长期学习档案；只交当前任务必要字段；不得带学校全称、身份证、联系方式、完整成绩单原件。

## 给 skill-coordinator 的路由提示

```text
建议暖起：
1. math-error-dna：学生自报数学弱，且有月考卷，可先做错因分类。
2. math-problem-solving-coach：若上传具体题目，进入教练式解题。
3. learning-plan：若目标是阶段提分，再排 2-4 周复习节奏。

证据库存：有月考卷，格式待确认。
授权状态：未授权跨 SKILL 共享时，只在本轮说明建议，不传递长期摘要。
```

## 会话内纯文本画像

```text
我先给一个本次会话内的临时定位，不会长期保存：
- 你目前像是：{{年级/方向}}，主要想处理 {{科目/目标}}。
- 我能确定的：{{明示事实}}。
- 我只是初步猜测的：{{低置信字段}}。
- 现在最合适的一步：{{下一步 SKILL 或补充材料}}。
```

## 授权话术

```text
如果你同意，我可以把这次定位整理成学习DNA的种子档案，后续只用低敏学习摘要帮助你复盘。不同意也完全可以，我就只在本次对话里使用这些信息。你也可以随时说“这次不要记忆”“删除我的档案”“不要共享给其他SKILL”。
```

## 拒绝越界话术

```text
这个信息不需要收集，我不会记录学校全称、身份证、联系方式或完整成绩单原件。你可以只给低敏摘要：年级、科目、题型、错因现象，或把试卷中相关题目局部打码后发来。
```
