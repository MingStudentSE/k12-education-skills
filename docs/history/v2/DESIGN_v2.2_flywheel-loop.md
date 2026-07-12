> **历史快照（无当前权威）**：本文件只记录 V2 当时的设计或执行过程。不要把其中的路径、Skill、依赖、路由、命令或“必须”表述用于当前四 Product Module；当前规则以根 `AGENTS.md`、`CONTEXT.md`、ADR 和现行 module 契约为准。

# DESIGN v2.2 · 飞轮闭环出口下沉(D4 系统性短板治理)

> **角色分工**:本文档由 GLM-5.2 撰写(改造构思),交由 Codex GPT-5.5 (xhigh) 执行。
> **触发原因**:2026-06-20 四引擎全场景交叉盲测显示,D4「飞轮闭环度」在所有引擎、所有运行中稳定垫底(5.4~7.2),是 8 维里唯一全员 < 7.5 的维度。判定为**体系设计缺陷**,非引擎能力问题。

---

## 1. 问题铁证:D4 是系统性短板

跨引擎 D4 打分(来源:`logs/scoring/2026-06-20_*`):

| 运行 | D4 | 备注 |
|---|---|---|
| GLM-5.2 自评(5/5) | **5.4** | 全维度最低 |
| DeepSeek V4 Pro | 6.0 / 6.6 | 最大短板 |
| Codex GPT-5.5 | 7.2 | 并列最大短板 |
| GPT-5.5 × GLM-5.2 交叉 | 6.4 / 6.8 | |
| Claude × Codex 首测 | 6.75 / 7.5 | 上限 |

对照:D5/D6/D7/D8 普遍 8~10。**三个独立引擎在同一维度集体失分 → 排除引擎偶然性 → 坐实体系缺陷。**

DeepSeek×Codex 交叉盲评 `REPORT.md` 的诊断原文:
> "两引擎在错题诊断后均缺少'费曼验证→笔记沉淀→复测安排→周复盘入口'的完整闭环链……建议在 correction-notebook 和 physics-error-dna 中强化沉淀和复测提醒机制。"

---

## 2. 三层根因(读完 coordinator / correction-notebook / physics-error-dna 后定位)

### 根因 A:飞轮链只活在 `skill-coordinator` 一处,而它「仅明确请求才激活」

`skill-coordinator/SKILL.md:44` 定义了完整飞轮链:
```
错题本 → 理科题目掌握 → 康奈尔笔记 → 费曼测试 → 学习计划/时间专注 → IM提醒
```
但触发边界是「**仅当学生明确要求多 SKILL 联动/系统健康/月报**」(`SKILL.md:22`)。真实场景(S1)学生只说"物理力学错得很离谱"→ coordinator 不激活 → 飞轮断在第一环。

**结论:把飞轮押在一个高门槛激活的协调器上,是架构性错误。**

### 根因 B:各上游 skill 的「交接·沉淀·复测·复盘」是末步可选项,不是强制产出

- `physics-error-dna/SKILL.md` 流程止于第 4 步「修复任务」+ 第 5 步「授权写入」,第 4 步只到"本周可执行小任务+下次检查方式",**没有强制接费曼/笔记/复测/复盘**。
- `correction-notebook/SKILL.md` 把跨技能交接放在流程第 7 步、`按 references/handover-protocols.md 执行`,属"按需"。
- 最直接的证据:`correction-notebook/references/handover-protocols.md:268-269` 的行为准则表自己写着——

  | ✅ 应该做 | ❌ 不能做 |
  |---|---|
  | 用变形题验证掌握 | **分析完就结束** |

  体系自己把"分析完就结束"列为禁止,但**没有任何机制阻止它**。

### 根因 C:handover 协议只画了横向交接,没画纵向飞轮

`handover-protocols.md:9-18` 的协作图只有「错题本 ↔ 各 error-DNA」的横向回写,**完全没有「错题→费曼→笔记→复测→复盘」这条纵向飞轮链**。schema 里也没有承载"飞轮推进"的 handoverType。

D4 要求的 6 环被拆给 7 个 skill(error-dna / science-solving / cornell-notes / feynman / coordinator / weekly-review / im-reminder),**没有任何一个组件对「全链闭合」负责**——无人守门。

---

## 3. 改造决策(已与用户对齐)

| 决策点 | 选择 | 理由 |
|---|---|---|
| **主路径** | 出口块下沉(去中心化) | 不依赖 coordinator 激活;改动分散但每处小;符合"单 skill 自包含"哲学 |
| **推进节奏** | 垂直试点先行 | 本轮只动 physics-error-dna + correction-notebook,重跑 S1 验收 D4≥8 再推广;先证伪风险 |
| **打分器** | rubric 1.0.0 → 1.1.0 + 新增 S6 飞轮场景 | 让 D4 可判定(拆 6 环扣分点),用专项场景精确测改进 |

**显式不选**:
- 不新增 skill(v2.1 已 62 个,体系不再膨胀)。
- 不改 `skill-coordinator` 触发边界(守"仅请求激活+最小必要"红线,避免授权门被破坏)。

---

## 4. 核心设计:飞轮闭环出口块(Flywheel Closure Block)v1.0

### 4.1 定位

错因类 SKILL 流程的**强制收尾**,与「先收三信息再分析」同级——漏输出 = D4 直接降分,列为失败红线。

### 4.2 触发时机

错因诊断完成 + 修复任务产出之后,本轮对话结束前**必输出**。与"授权写入"耦合:复测/沉淀/复盘的"实际写"需要授权,但"出口块本身"无论授权与否都必须输出(未授权时给"建议字段+授权门",不实际写)。

### 4.3 四要素(每要素缺证据写 `N/A(原因)`,禁止臆造)

| 要素 | 产出内容 | 接力目标 SKILL | 触发判断 |
|---|---|---|---|
| ① 掌握验证 `masteryCheck` | 验证形式 + 通过判定标准 | 主错因 ∈ {P 图景 / C 概念} → `feynman-learning`(让生自己复述+画图景);∈ {F/R/T} → `science-solving-four-steps`(1 道变式,独立做到第一步) | 概念/图景类**必触发费曼**;方法/过程类**必出变式** |
| ② 沉淀入口 `sinkEntry` | 目标档案 + 字段摘要 + 授权状态 | `correction-notebook`(表面,去重一条) + `cornell-notes`(概念/模型混淆时加线索栏) | 授权门:未授权→给建议字段不实写 |
| ③ 复测安排 `retestSchedule` | 首测时间 + 间隔序列 + 复测形式 | `im-reminder`(授权后) | 必给具体时间点:T+1 → T+3 → T+7 → T+14,复测用**变式题非原题** |
| ④ 复盘入口 `reviewEntry` | 本周纳入项 + 触发信号 | `weekly-review` | 必给:本题纳入周复盘 + 触发信号(同类累计/未通过复测) |

### 4.4 输出格式(SKILL.md 内的强制块,两处 skill 统一)

```markdown
## 飞轮闭环出口(本轮错因必须推进)
- ① 掌握验证:[feynman|变式|N/A] · 形式 · 通过判定(学生能说出/画出__算掌握)
- ② 沉淀入口:[错题本+物理DNA 去重|康奈尔线索|N/A] · 字段 · 授权状态
- ③ 复测安排:[T+1→T+3→T+7→T+14] · 变式题 · 载体(im-reminder,授权后)
- ④ 复盘入口:[本周纳入项] · 触发信号(同类累计≥?/复测未过)· weekly-review
```

### 4.5 handover 扩展(纵向飞轮链)

在 `correction-notebook/schemas/handover-protocol.schema.json` 新增 `handoverType: "flywheel_handoff"`,payload 携带四要素。`handover-protocols.md` 协作图补一条纵向链:

```
错题诊断(error-dna) ──飞轮出口──> 费曼验证 → 康奈尔沉淀 → im-reminder 复测 → weekly-review 复盘
```

### 4.6 depends_on 原则

飞轮出口点名 feynman/cornell/im-reminder/weekly-review 作为"出口目标",但 `depends_on` 只追加 `feynman-learning`(掌握验证是硬依赖);其余作为出口块内的"可选接力目标"点名,不全部塞进 depends_on,避免耦合膨胀。

---

## 5. D4 rubric v1.1.0:从"整体感觉"到"6 环可判定"

当前 D4 三档锚点(10/5/1)主观,裁判难一致。v1.1.0 拆 6 环,裁判数达成环数落区间:

```
D4 飞轮闭环度(15) — rubric v1.1.0
飞轮 6 环:①错因分类 ②掌握验证 ③沉淀入口 ④复测时间点 ⑤复盘入口 ⑥闭环自洽

- 9-10:6 环全达成,复测时间点具体到日,复盘有触发信号
- 7-8 :达成 4-5 环(典型:错因+验证+沉淀齐,但复测或复盘缺一项)
- 5-6 :达成 2-3 环(典型:错因+部分沉淀,无验证/复测/复盘)← 当前各引擎聚集区
- 3-4 :仅 1 环(只有错因分类,无后续推进)
- 1-2 :0 环(只给答案/泛泛鼓励)

裁判要点:环④(复测时间点)与环⑤(复盘入口)是当前最大缺口,缺则不得给 7+。
```

**这条改动本身就能让裁判把"分析完就结束"的行为稳定判到 3-4 分**,而不是现在含糊的 5-6。

---

## 6. 新增场景 S6 · 飞轮闭环压力测试

S1-S5 都是单点探测(D4 只是顺带考)。S6 是**飞轮专项**,6 轮逐环逼迫,精确定位断在哪一环:

```yaml
id: S6-flywheel-loop
难度: 高(多轮强制闭环)
考察: D4(主), D3, D5, D8
personaGroundTruth:
  学段: 高二理科
  痛点: 斜面受力分析题连续错 3 次,自述"看答案懂了又错"(顽固弱项 P 图景)
  授权: 同意本次诊断+沉淀,未授权长期画像
scriptedTurns:
  1. "斜面受力题这周又错第3次,看解析都懂,一做就错,怎么破?"   # 环①错因分类
  2. "那图景问题,我怎么知道这次是真懂不是假装懂?"              # 环②掌握验证→费曼
  3. "我画了你看对不对。这道要不要记下来?"                     # 环③沉淀入口(授权感知)
  4. "记完了,什么时候再测?不想下周又忘。"                      # 环④复测时间点
  5. "这周还有别的错题,怎么一起管?"                            # 环⑤复盘入口
  6. "所以我现在第一步先干啥?"                                  # 环⑥闭环自洽 + D8
scoringAnchors:
  10: 6 环全打通,复测具体到日,复盘有触发信号
  5:  错因+验证+沉淀有,但复测或复盘断链
  1:  只逐题讲解,无任何飞轮推进
```

scenarioSetVersion 1.0.0 → 1.1.0(纳入 S6)。

---

## 7. 试点范围与验收标准

### 7.1 本轮 Codex 只动(垂直试点)

| 文件 | 改动 |
|---|---|
| `skills/physics/physics-error-dna/SKILL.md` | 加「飞轮闭环出口」强制块(§4.4 格式)+ depends_on 追加 feynman-learning |
| `skills/general/correction-notebook/SKILL.md` | 同上,出口块作为流程强制收尾;红线表加"分析完就结束"可执行判定 |
| `skills/general/correction-notebook/references/handover-protocols.md` | 协作图补纵向飞轮链;新增 §flywheel_handoff 协议 |
| `skills/general/correction-notebook/schemas/handover-protocol.schema.json` | 新增 `handoverType: "flywheel_handoff"` |
| `skills/general/system-quality-scoring/references/scoring-rubric.md` | D4 细化为 6 环可判定,bump v1.1.0 |
| `skills/general/system-quality-scoring/references/judge-prompt.md` | D4 判定规则同步(6 环区间) |
| `skills/general/system-quality-scoring/scenarios/S6-flywheel-loop.md` | 新增(§6) |
| `skills/general/system-quality-scoring/SKILL.md` | rubricVersion/scenarioSetVersion bump 1.1.0;场景速览加 S6;D4 锚点更新 |

### 7.2 验收门(全过才算本轮完成)

1. **结构门**:`bash pipeline/review.sh` 全过(每 SKILL ≤150 行、refs 无悬空/孤儿、JSON 合法)。
2. **一致性门**:physics-error-dna 与 correction-notebook 的「飞轮闭环出口」块**逐字同规格**(四要素、格式、授权语义一致)。
3. **基准门**:重跑 S1 + S6 双引擎交叉盲测(rubric v1.1.0),**D4 ≥ 8**(S1 从 5-7 拉到 8+;S6 新场景作为飞轮专项基线)。
4. **版本门**:rubricVersion 1.0.0 → 1.1.0;scenarioSetVersion 1.0.0 → 1.1.0;两 SKILL version 各 +0.1。

**未通过 → 回滚,分析飞轮断在哪环,不急于推广全科。**

### 7.3 通过后(下一轮,非本次)

把出口块规格复制到其余 error-dna(math/chemistry/biology/english/history/geography/politics)+ 其余错因类 skill;并在 `system-quality-scoring` 回归基准里登记 v1.1.0 基线。

---

## 8. 风险与回滚

| 风险 | 缓解 |
|---|---|
| SKILL.md 超 150 行(review.sh 硬门) | 出口块紧凑(≤12 行),必要时把"顽固弱项/焦虑"等非核心段精简,不删铁律 |
| 出口块变成"模板八股",学生觉得啰嗦 | 出口块是**结构化最低产出**,对话话术仍由 skill 自由组织;块是"必须覆盖的点",不是"必须照念的稿" |
| 复测时间点臆造(T+1 等无依据) | 复测序列基于间隔复习公认曲线,非学生个人数据;但**禁止编造学生历史复习记录**,未授权只给"建议时间" |
| 试点通过但全科推广时学科差异大 | 试点用 physics(图景类,飞轮需求最典型);推广时每学科先确认主错因→验证形式的映射 |
| rubric 改版让历史分数不可比 | bump 版本号;报告免责声明里标注"v1.1.0 与 v1.0.0 的 D4 不可直接比,需同版本对照" |

---

## 9. 与 v2.1 的关系

- v2.1 新增了「前置画像师 + 质量打分校验器」,解决的是**测得准**(D1 画像、打分协议)。
- v2.2 解决的是**测出来后修得动**——D4 是打分器第一次明确指出的体系级短板,本次用最小侵入的「出口块下沉」治掉它,并把打分器自身升级到能精确复测(rubric 1.1.0 + S6)。
- 形成闭环:**打分器指出短板 → 改造 skill → 打分器升级能更准测 → 重测验证**。这正是「飞轮闭环」方法论本身在 SKILL 工程上的落地。
