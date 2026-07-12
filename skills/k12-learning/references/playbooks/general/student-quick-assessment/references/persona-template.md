# 初版学习 DNA 交付模板

所有模板默认会话内使用；只有用户明确同意建档时，才把最小摘要交给 `learning-dna`。方法组合由 `k12-learning` 主流程基于当前请求直接完成。

## 初版学习 DNA Markdown 模板

```markdown
## 初版学习 DNA（仅本次会话）

### meta
- profileId: {{平台生成的低敏ID，例如 intake-20260711-001}}
- schemaVersion: 1.0.0
- createdAt: {{ISO 8601 时间}}
- consentStatus:
  - profileEnabled: {{true/false}}
  - memoryPaused: {{true/false}}
  - crossSkillSharing: {{true/false}}
  - reminderConsent: {{true/false}}

### routingHints
- gradeLevel: { value: {{学段年级}}, confidenceLevel: {{...}} }
- textbookVersion: { value: {{教材版本}}, confidenceLevel: {{...}} }（不确定时省略）
- subjectSet: {{科目对象清单；每项包含 value 与 confidenceLevel}}
- track:
  - stage: {{初中/高中}}
  - type: {{全科/文理分科/新高考3+1+2}}
  - combination: {{科目对象清单}}
  - confidenceLevel: {{...}}

### evidenceInventory（不确定的布尔字段直接省略，不写 unknown）
- hasHomework: { value: {{true/false}}, confidenceLevel: {{...}} }
- hasExams: { value: {{true/false}}, confidenceLevel: {{...}} }
- hasErrorBook: { value: {{true/false}}, confidenceLevel: {{...}} }
- format: {{拍照/文字/文件/暂无}}

### seedForDNA
- basicInfo: {{短期目标、考试节点、可用时间}}
- subjectMap: {{初步强项/弱项，全部低置信待验证}}
- learningStyle: {{讲解偏好、节奏偏好}}

```

下一步动作属于给用户看的解释，不放进上述 Schema payload，避免与 `routingHints` 契约混杂。

## 给 learning-dna 的种子

```json
{
  "meta": {
    "profileId": "intake-20260711-001",
    "schemaVersion": "1.0.0",
    "createdAt": "2026-07-11T09:00:00+08:00",
    "consentStatus": {
      "profileEnabled": false,
      "memoryPaused": false,
      "crossSkillSharing": false,
      "reminderConsent": false
    }
  },
  "routingHints": {
    "gradeLevel": {
      "value": "高二",
      "confidenceLevel": "preliminary_trend"
    },
    "subjectSet": [
      {
        "value": "数学",
        "confidenceLevel": "preliminary_trend"
      }
    ],
    "track": {
      "stage": "高中",
      "type": "新高考3+1+2",
      "combination": [],
      "confidenceLevel": "insufficient_sample"
    }
  },
  "evidenceInventory": {
    "hasExams": {
      "value": true,
      "confidenceLevel": "preliminary_trend"
    },
    "format": ["文件"]
  },
  "seedForDNA": {
    "basicInfo": {
      "shortTermGoal": {
        "value": "下次数学月考减少压轴题失分",
        "confidenceLevel": "preliminary_trend"
      },
      "upcomingExams": [],
      "availableStudyTime": {
        "value": "每天晚间约40分钟",
        "confidenceLevel": "preliminary_trend"
      }
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
      "preferredExplanationMode": [
        {
          "value": "先拆题目结构，再做变式验证",
          "confidenceLevel": "preliminary_trend"
        }
      ],
      "conversationPace": {
        "value": "快节奏，少讲大道理",
        "confidenceLevel": "preliminary_trend"
      }
    }
  }
}
```

交付条件：用户明确同意建长期学习档案；只交当前任务必要字段；不得带学校全称、身份证、联系方式、完整成绩单原件。

## 给 k12-learning 主流程的会话内行动提示

```text
已查看证据：一份数学月考卷局部，含学生原过程。
初步判断：当前最值得先验证的是函数题中的条件转化；只是一份材料支持的局部判断。
立即行动：选卷面上一道代表题，找到第一处分叉，给一级提示后让学生自行修正，再做一道同结构微型变式。
授权状态：未授权跨会话保存，只在本轮使用这份初版学习 DNA。
```

## 会话内纯文本初版 DNA

```text
【初版学习 DNA｜仅本次会话】
- 当前阶段与目标：{{年级/学科/当前想解决的一件事}}。
- 已查看证据：{{材料与学生过程}}。
- 当前优势：{{当前材料直接支持的一点}}。
- 首要卡点：{{第一个失效步骤或可训练机制}}。
- 待验证项：{{一次材料不能证明的部分}}。
- 现在开始：{{一个 5–10 分钟真实学习动作}}。
```

## 授权话术

```text
要不要把这份初版学习 DNA 跨会话保存，供以后继续验证和修正？如果同意，我会先列出要保存的低敏字段、用途、位置和删除方式。不同意也完全可以，这次学习照常继续。
```

## 拒绝越界话术

```text
这个信息不需要收集，我不会记录学校全称、身份证、联系方式或完整成绩单原件。你可以只给低敏摘要：年级、科目、题型、错因现象，或把试卷中相关题目局部打码后发来。
```
