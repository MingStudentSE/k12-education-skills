> **历史快照（无当前权威）**：本文件只记录 V2 当时的设计或执行过程。不要把其中的路径、Skill、依赖、路由、命令或“必须”表述用于当前四 Product Module；当前规则以根 `AGENTS.md`、`CONTEXT.md`、ADR 和现行 module 契约为准。

# CODEX EXEC v2.2 · 飞轮闭环出口下沉(执行指令)

> **执行者**:Codex GPT-5.5(reasoning effort = **xhigh**)
> **设计依据**:`docs/history/v2/DESIGN_v2.2_flywheel-loop.md`(GLM-5.2 撰写,先读再动手)
> **本轮范围**:垂直试点——只动 physics-error-dna + correction-notebook + 打分器。**不得扩展到其他学科 skill。**
> **验收硬门**:全部任务完成后,必须依次跑「结构门 → 一致性门 → 基准门 → 版本门」(见 §10),任一不过即回滚定位,不得谎报完成。

---

## 0. 全局约束(每个任务都受此约束)

1. **不得改 `skill-coordinator` 的触发边界**。飞轮靠"出口块下沉",不靠协调器。协调器一行不动。
2. **不得新建 SKILL**。本轮零新增 skill,只改现有文件 + 新增 1 个场景文件 + 改 1 个 schema。
3. **不得臆造数据**。复测时间点(T+1/T+3/T+7/T+14)基于间隔复习公认曲线,可给"建议时间";但**禁止编造学生的历史复习记录、历史错题数、档案内容**。授权状态未明时一律标"未授权"。
4. **守 150 行硬门**。每个 SKILL.md 不得超过 150 行(`pipeline/review.sh` 会卡)。飞轮出口块必须紧凑(目标 ≤12 行)。要腾位就精简非核心段,**不得删任何学科铁律、不得删失败红线**。
5. **两处 skill 的出口块必须逐字同规格**(四要素、字段名、授权语义完全一致),一致性门会逐字对比。
6. **JSON 合法门**:`test-prompts.json`、`handover-protocol.schema.json` 改完必须 `python3 -m json.tool` 通过。
7. 改完任一 SKILL.md,先自检 `references/` 下每个文件都在主文件被引用、主文件每个 `references/` 引用都指向存在文件(孤儿/悬空检测)。

---

## 任务 A · `skills/physics/physics-error-dna/SKILL.md`

### A1. depends_on 追加 feynman-learning

定位 frontmatter `depends_on`(当前:`learning-dna, physics-problem-coach, correction-notebook`),改为:
```yaml
depends_on: learning-dna, physics-problem-coach, correction-notebook, feynman-learning
```
> 理由:掌握验证是飞轮硬依赖。cornell-notes / im-reminder / weekly-review 作为出口块内"接力目标"点名,不进 depends_on(避免耦合膨胀,见 DESIGN §4.6)。

### A2. 流程骨架:在第 5 步「授权写入」之后,新增第 6 步「飞轮闭环出口」

当前流程止于:
```
4. **产出修复任务**：给一个本周可执行的小任务和下一次检查方式。
5. **授权写入**：只有用户同意后才写档案、同步 learning-dna、创建提醒或月报。
```
在其后新增:
```
6. **飞轮闭环出口（强制）**：诊断+修复任务完成后，本轮对话结束前必须按四要素产出飞轮推进链（见 §7 出口格式）。漏任一要素 = D4 直接降分，等同失败红线。
```

### A3. §7 输出格式:在「## 修复任务」块之后追加「## 飞轮闭环出口」块

在第 107 行(现有输出格式 markdown 块结束后)追加:
```markdown

## 飞轮闭环出口（本轮错因必须推进）
- ① 掌握验证：主错因∈{P图景/C概念}→触发 `feynman-learning`（让生自己复述+画图景）；∈{F/R/T}→出1道变式（`science-solving-four-steps`，独立做到第一步）。给通过判定：学生能说出/画出__算掌握。
- ② 沉淀入口：通用错题本记表面+本DNA记根因（同一事件去重一条）；概念/模型混淆→同时写康奈尔线索栏。给字段摘要+授权状态（未授权只给建议字段，不实写）。
- ③ 复测安排：T+1→T+3→T+7→T+14 间隔序列，复测用变式题（非原题），载体 `im-reminder`（授权后）。
- ④ 复盘入口：本题+本周同类纳入 `weekly-review`，给触发信号（同类累计≥3 或 复测未过）。
```

### A4. §9 失败与降级红线:新增一条

在红线列表末尾追加:
```markdown
- **不得分析完就结束**：错因诊断后必须产出飞轮闭环出口四要素；只给修复任务而无掌握验证/沉淀/复测/复盘推进，等同 `correction-notebook` 行为准则明令禁止的"分析完就结束"。
```

### A5. version bump

frontmatter `version: 1.0.0` → `1.1.0`。

---

## 任务 B · `skills/general/correction-notebook/SKILL.md`

> 本 skill 是飞轮的「沉淀枢纽」,出口块必须与 physics-error-dna **逐字同规格**。

### B1. depends_on 追加

当前:`learning-dna, math-error-dna, physics-error-dna`,改为:
```yaml
depends_on: learning-dna, math-error-dna, physics-error-dna, feynman-learning, cornell-notes
```

### B2. 核心流程骨架:把第 7 步「跨技能交接」升级为「飞轮闭环出口」

当前第 6-7 步:
```
6. **档案与预警**：按错题档案结构写入；同类错误 3 次...触发预警。
7. **跨技能交接**：数学/物理深度分析...按 `references/handover-protocols.md` 执行。
```
把第 7 步改为(保留原交接内容,前置飞轮出口):
```
7. **飞轮闭环出口（强制）**：错因分析+档案预警完成后，本轮必须按四要素产出飞轮推进链（掌握验证/沉淀入口/复测安排/复盘入口），格式见下方出口块。跨 skill 交接按 `references/handover-protocols.md`（含新增的 `flywheel_handoff` 纵向飞轮协议）执行。
```

### B3. 新增「## 飞轮闭环出口」块(紧接流程骨架之后,与 physics-error-dna 逐字一致)

```markdown
## 飞轮闭环出口（本轮错因必须推进）
- ① 掌握验证：概念类错因→触发 `feynman-learning`（让生自己复述+画图景）；方法/过程/计算类→出1道变式（`science-solving-four-steps`，独立做到第一步）。给通过判定：学生能说出/画出__算掌握。
- ② 沉淀入口：通用错题本记表面+对应学科DNA记根因（同一事件去重一条）；概念/模型混淆→同时写 `cornell-notes` 线索栏。给字段摘要+授权状态（未授权只给建议字段，不实写）。
- ③ 复测安排：T+1→T+3→T+7→T+14 间隔序列，复测用变式题（非原题），载体 `im-reminder`（授权后）。
- ④ 复盘入口：本题+本周同类纳入 `weekly-review`，给触发信号（同类累计≥3 或 复测未过）。
```
> 一致性门要点:四要素顺序、字段名(masteryCheck/sinkEntry/retestSchedule/reviewEntry 对应的①②③④)、授权语义、T+1→T+3→T+7→T+14 序列,两处必须一致。话术可按学科调整(P图景/C概念 vs 通用表述),但**结构逐字一致**。

### B4. 失败模式与红线:新增一条

```markdown
- **不得分析完就结束**：错因分析后必须产出飞轮闭环出口四要素；只归档/预警而无掌握验证、复测时间点、复盘入口，等同本 SKILL `references/handover-protocols.md` 行为准则明令禁止的"分析完就结束"。
```

### B5. version bump

`version: 1.2.1` → `1.3.0`(飞轮是能力级升级,跳 minor)。

---

## 任务 C · `skills/general/correction-notebook/references/handover-protocols.md`

### C1. §9.1 协作图补纵向飞轮链

当前协作图(第 9-18 行)只有横向交接。在图后追加纵向飞轮链:
```text
纵向飞轮链（错因诊断后强制推进，见各上游 SKILL「飞轮闭环出口」块）
错题诊断(correction-notebook / *-error-dna)
    ──①掌握验证──> feynman-learning / science-solving-four-steps
    ──②沉淀────> cornell-notes（线索栏）
    ──③复测────> im-reminder（T+1/T+3/T+7/T+14 间隔）
    ──④复盘────> weekly-review（本周纳入 + 触发信号）
```

### C2. 新增 §9.4 flywheel_handoff 协议(置于 §9.3 之后、§十之前)

```markdown
### 9.4 纵向飞轮交接协议（flywheel_handoff）

错因诊断完成后，上游 SKILL（correction-notebook / 各 *-error-dna）向飞轮下游接力时使用 `handoverType: "flywheel_handoff"`，payload 携带四要素。

交接触发：错因分类完成 + 修复任务产出后，本轮强制产出（授权与否都产出；未授权只给建议字段）。

四要素与目标 SKILL：
| 要素 | 目标 SKILL | 必给内容 |
|---|---|---|
| ① 掌握验证 | feynman-learning（概念/图景类）/ science-solving-four-steps（方法/过程类变式） | 验证形式 + 通过判定标准 |
| ② 沉淀入口 | correction-notebook（表面，去重）+ cornell-notes（概念混淆线索栏） | 字段摘要 + 授权状态 |
| ③ 复测安排 | im-reminder | T+1→T+3→T+7→T+14 + 变式题形式 |
| ④ 复盘入口 | weekly-review | 本周纳入项 + 触发信号 |

去重：同一错题事件只产一条 flywheel_handoff；通用错题本与学科 DNA 的沉淀按 §9.2/§9.3 纵向去重规则，不重复存。
```

---

## 任务 D · `skills/general/correction-notebook/schemas/handover-protocol.schema.json`

> 先读现有 schema 结构,理解 `handoverType` 的定义方式(enum 还是 oneOf),再扩展。

### D1. 新增 `flywheel_handoff` 类型

- 在 `handoverType` 的允许值里追加 `"flywheel_handoff"`。
- 新增对应 payload 定义:`flywheel` 对象含 `masteryCheck` / `sinkEntry` / `retestSchedule` / `reviewEntry` 四字段,每字段为对象(具体子字段参考 §C2 表格的"必给内容")。
- `retestSchedule` 含 `firstAt`(字符串,如 "T+1")、`intervals`(数组 [1,3,7,14])、`form`(字符串)。
- 保持向后兼容:不破坏现有 `wrong_answer_handover` 等类型。

### D2. JSON 合法自检

```bash
python3 -m json.tool skills/general/correction-notebook/schemas/handover-protocol.schema.json > /dev/null
```
必须 exit 0。

---

## 任务 E · `skills/general/system-quality-scoring/references/scoring-rubric.md`

### E1. 顶部版本号 bump

第 1 行 `# 系统质量打分 Rubric v1.0.0` → `v1.1.0`。

### E2. D4 整段替换为 6 环可判定版

定位 `## D4 飞轮闭环度（15）` 整段(当前第 37-43 行),替换为:
```markdown
## D4 飞轮闭环度（15）— v1.1.0 六环可判定

定义：是否沿"错题→错因→掌握→费曼验证→沉淀→复测→复盘"推进。v1.1.0 起按飞轮 6 环达成数判分。

飞轮 6 环：①错因分类 ②掌握验证 ③沉淀入口 ④复测时间点 ⑤复盘入口 ⑥闭环自洽

- 9-10：6 环全达成；复测时间点具体到日（T+1/T+3/T+7/T+14），复盘有触发信号，四要素前后自洽。
- 7-8：达成 4-5 环（典型：错因+验证+沉淀齐，但复测或复盘缺一项）。
- 5-6：达成 2-3 环（典型：错因+部分沉淀，无验证/复测/复盘）。
- 3-4：仅 1 环（只有错因分类，无后续推进）。
- 1-2：0 环（只给答案/泛泛鼓励，无任何飞轮动作）。

裁判要点：环④（复测时间点）与环⑤（复盘入口）是当前最大缺口；缺这两环不得给 7+。证据须引用 trace 中可定位的飞轮推进片段，无证据写 N/A。
```

### E3. 计分公式块版本标注

在计分公式块上方加注释:`# Rubric v1.1.0（D4 改为六环可判定；D1/D2/D3/D5-D7/D8 不变）`。其余维度不动。

---

## 任务 F · `skills/general/system-quality-scoring/references/judge-prompt.md`

### F1. 强约束第 2 条之后,新增 D4 判定指引

在固定提示词的强约束列表里(第 2 条之后)插入:
```text
2.1 D4 飞轮闭环度按 rubric v1.1.0 的六环判定：①错因分类 ②掌握验证 ③沉淀入口 ④复测时间点 ⑤复盘入口 ⑥闭环自洽。数达成环数落区间（9-10/7-8/5-6/3-4/1-2）。环④复测时间点与环⑤复盘入口缺失则不得给 7+。每环达成须引 trace 片段，缺证据按缺环计。
```

### F2. scorecard 模板 rubricVersion 字段

JSON 模板里 `"rubricVersion": "1.0.0"` → `"1.1.0"`(两处:meta 和说明文字)。

---

## 任务 G · `skills/general/system-quality-scoring/scenarios/S6-flywheel-loop.md`(新增)

完整内容(照 DESIGN §6 落地,补全 exercises 与 persona 细节):
```markdown
# 场景 S6 · 飞轮闭环压力测试

- id: `S6-flywheel-loop`
- 难度: 高（多轮强制闭环）
- 考察维度: D4(主), D3, D5, D8

## personaGroundTruth

- 学段: 高二理科
- 方向: 物化生
- 证据: 斜面+受力分析题本周第 3 次错，有试卷
- 痛点: 自述"看解析都懂，一做就错"（顽固弱项，主错因 P 图景建立）
- 目标: 不只是讲清这题，要确保"下次不再错"
- 授权态度: 同意本次诊断+沉淀，未授权长期画像

## scriptedTurns

1. "斜面受力题这周又错第 3 次了，每次看解析都觉得懂，自己做又错，到底怎么破？"
2. "你说的图景问题，我怎么知道这次是真懂了，不是假装懂？"
3. "好，我画了受力图，你看对不对。这道要不要记下来？"
4. "记完了，那我什么时候再测？不想下周又忘。"
5. "这周我还有别的科错题，怎么一起管？"
6. "所以我现在第一步先干什么？"

## exercises

- D4-环①: 应判定顽固弱项 + 主错因 P 图景建立（3 次同类）。
- D4-环②: 应触发 feynman-learning，让学生自己画斜面受力图并解释，给通过判定。
- D4-环③: 应给通用错题本+物理 DNA 去重字段，授权感知（未授权只给建议）。
- D4-环④: 应给 T+1/T+3/T+7/T+14 复测时间点 + 变式题形式。
- D4-环⑤: 应接 weekly-review，给本周纳入项 + 触发信号。
- D4-环⑥: 第 6 轮"第一步"应与前 5 环自洽（复测形式匹配错因类型）。
- D3: 应守物理"先画图景"铁律，不直接甩答案。
- D5: 应把斜面题拆到可做一步，不一上来给整套高压训练。
- D8: 第 6 轮应收在学生现在能做的一步。

## scoringAnchors

- 10 分: 飞轮 6 环全打通，复测时间点具体到日，复盘有触发信号，四要素自洽。
- 5 分: 错因+验证+沉淀有，但复测时间点或复盘入口断链。
- 1 分: 只逐题讲解，无任何飞轮推进。
```

---

## 任务 H · `skills/general/system-quality-scoring/SKILL.md`

### H1. frontmatter version + tags

`version: 1.2.0` → `1.3.0`;tags 追加 `rubric-v1.1.0`。

### H2. 8 维 rubric 速览表 D4 锚点

当前 D4 行:`| D4 飞轮闭环度 | 15 | 沿错题→错因→掌握→费曼→沉淀→复习→复盘推进 |`
锚点列改为:`| 沿飞轮6环推进；缺复测时间点/复盘入口不得7+（v1.1.0六环） |`

### H3. references 与场景:加 S6

在场景列表(第 111-115 行)末尾追加:
```markdown
- S6：高二物理顽固弱项飞轮闭环压力测试，6 轮逐环逼迫，专考 D4 全链。
```

### H4. 评测协议提示 rubricVersion

在「scorecard 输出要求」的 meta 说明里,把 `rubricVersion` 默认值标注为 `1.1.0`;`scenarioSetVersion` 标注 `1.1.0`(含 S6)。

---

## 任务 I · 自检(每任务改完即跑,不堆到最后)

```bash
# 1. JSON 合法
python3 -m json.tool skills/general/correction-notebook/schemas/handover-protocol.schema.json > /dev/null
python3 -c "import json; json.load(open('skills/general/system-quality-scoring/test-prompts.json'))"

# 2. SKILL.md 行数 ≤150
for f in skills/physics/physics-error-dna/SKILL.md skills/general/correction-notebook/SKILL.md skills/general/system-quality-scoring/SKILL.md; do
  echo "$(wc -l < "$f") $f"
done

# 3. 孤儿/悬空 + 全科结构门
bash pipeline/review.sh all
```
review.sh 必须 `SUMMARY` 行 `基础失败 0`。

---

## 任务 J · 一致性门(出口块逐字对比)

人工/xhigh 实读:把 physics-error-dna 与 correction-notebook 的「飞轮闭环出口」块并排比对。检查清单:
- [ ] 四要素顺序一致(①掌握验证 ②沉淀入口 ③复测安排 ④复盘入口)
- [ ] 复测序列同为 `T+1→T+3→T+7→T+14`
- [ ] 授权语义一致(未授权只给建议字段)
- [ ] 接力 SKILL 同名(feynman-learning / cornell-notes / im-reminder / weekly-review)
- [ ] 都把"分析完就结束"列为失败红线

---

## 任务 K · 基准门(重跑盲测验证 D4 ≥ 8)

> 这是本轮的**证伪验收**。没过就回滚,不推广。

1. 新建运行目录 `logs/scoring/2026-06-21_v2.2-flywheel-pilot/`(用今天日期)。
2. 用 rubric v1.1.0 + scenarioSet v1.1.0(S1+S6),双引擎(Codex GPT-5.5 × GLM-5.2)交叉盲测。
3. 按 `references/blind-test-protocol.md` 脱盲 → 交叉裁判 → 聚合。
4. **通过线**:
   - S1 的 D4 均分 **≥ 8**(对比 v1.0.0 基线 5.4~7.2)。
   - S6 作为飞轮专项新基线,D4 ≥ 8。
   - D1/D2/D3/D5-D8 不得因改动而下降超过 0.5(回归保护)。
5. 产出 `<runDir>/REPORT.md` + `FINAL_aggregate.json`,报告免责声明必须写明"rubric v1.1.0 与 v1.0.0 的 D4 不可直接数值对比,需同版本对照"。
6. **未达 D4≥8**:在 REPORT.md 写"飞轮断在第__环"的定位分析,回滚出口块改动,把发现写回 `pipeline/` 设计文档,等下一轮。**不得改 rubric 让分数好看。**

---

## §10. 验收门总表(全过才算本轮完成)

| 门 | 命令/动作 | 通过标准 |
|---|---|---|
| 结构门 | `bash pipeline/review.sh all` | `基础失败 0` |
| JSON 门 | `python3 -m json.tool` ×2 | exit 0 |
| 行数门 | `wc -l` ×3 | 每个 ≤150 |
| 一致性门 | 出口块逐字对比(§J) | 5 项全勾 |
| 版本门 | rubric 1.1.0 / scenarioSet 1.1.0 / 两 SKILL version 各 bump | 全部生效 |
| **基准门** | 重跑 S1+S6 交叉盲测 | **D4 ≥ 8** 且其余维度回归不降 |

---

## §11. 禁止项(违反即判定本轮失败)

- ❌ 改 `skill-coordinator` 任何内容
- ❌ 新建 SKILL 目录
- ❌ 把出口块扩到 math/chemistry/其他 error-dna(本轮只试点 physics + correction-notebook)
- ❌ 为凑 D4≥8 修改 rubric 放水或给裁判提示偏向
- ❌ 编造学生历史复习记录/错题数/档案数据
- ❌ 删学科铁律或既有失败红线给出口块腾行
- ❌ 只改 skill 不重跑盲测就谎报"D4 已提升"

---

## §12. 交付清单

- [ ] 8 个文件改动(A-H)+ 1 个 schema 扩展(D)
- [ ] `pipeline/review.sh all` 通过
- [ ] 一致性门 5 项勾选
- [ ] `logs/scoring/2026-06-21_v2.2-flywheel-pilot/REPORT.md` + `FINAL_aggregate.json`
- [ ] 一句话结论回主对话:本轮 D4 是否达 8、飞轮断在哪环(若有)、是否可进入下一轮全科推广
