> **历史快照（无当前权威）**：本文件只记录 V2 当时的设计或执行过程。不要把其中的路径、Skill、依赖、路由、命令或“必须”表述用于当前四 Product Module；当前规则以根 `AGENTS.md`、`CONTEXT.md`、ADR 和现行 module 契约为准。

# CLAUDE_GUIDE_K12 v2 —— K12 skills 打磨产线指导书

> 产线：当前仓库 ｜ 规则单一来源：本文件 + 编号最大的 REVIEW 文件
> v2 变更：合并 REVIEW_K12_002/003 全部新规（v1 时代的 REVIEW 散装链条曾丢失）。每接一个任务先重读本文件，再读编号最大的 REVIEW 文件（如有），最后开工。
> 原 34/34 瘦身已于 2026-06-12 完成并通过三闸口；当前仓库已扩展为 60 个 Skill，本指导书继续适用于：打回整改、新技能接入、瘦身迭代和质量门回归。

## 使命

按本指导书逐技能打磨当前仓库 `skills/<subject>/<skill>/`。历史病灶与体检方法参考 REVIEW_K12_002/003/004。

## 方法论：鲁班五动作（每技能走完整五步）

1. **验料**：读该技能 SKILL.md + references/ + test-prompts.json 全文，列主文件职责清单。
2. **访行**：每条 test-prompt 走一遍"用户问这个→主文件哪段接住→需要哪个细则文件"。
3. **过尺**：对照硬标准打分，列差距清单。
4. **慢刨**：一次只刨一个技能，改完即 commit。
5. **回炉**：跑自检命令，结果写 worklog。自检不过不许 commit。

## 瘦身硬标准

**主文件 SKILL.md ≤150 行**，五块缺一即 FAIL：
1. frontmatter（name 一个字符不许动；description 可润色语义不变）
2. 触发条件 + 不触发边界
3. 核心流程骨架（步骤名+每步一句话，细节指向 references/）
4. 失败模式/红线（集中成一节）
5. references/ 文件索引（每文件一行：什么时候读它）

## 外移与搬家规则（v2 强化，违反即 FAIL）

1. **强制搬家型**：模板、长示例、状态机、评分细则、理论阐述→逐字外移到本技能 references/，**禁止压缩重写**。实证：搬家型关键词零丢失可免实读直接过审；重写型逼终审逐个实读且四学科批因此打回 3 件。
2. **指针真实性**：主文件写"细则见 references/X"前，必须 grep 确认 X 真实包含该内容；X 是旧文件且内容缺失时，先把内容搬进去再指。伪造指针=整单 FAIL（四学科批实案：chinese-reading-decoder）。
3. **外移声明可验证**：worklog 外移清单写"原版哪一节→哪个文件哪一节"，目标文件必须是本次新建或修改过的。声称外移到未动过的文件=失实记录。
4. **长示例只许搬家不许删**（实案：chinese-classical-revival 苏轼示范被删打回）。
5. **二级标题去向交代**：原版每个 ##/### 标题在 worklog 里一行去向（外移到哪/压缩进哪节/重复删除+与哪个文件重复）。
6. 外移文件必须被主文件索引（孤儿=FAIL）；引用的文件必须存在（悬空=FAIL）；禁止依赖仓库根 references/ 或其他技能目录（自包含）。
7. 中文保持中文；不把 runtime 写死为某一平台。

## 语义不丢军规

test-prompts.json 每条 prompt 在新版仍能路由到答案。瘦身是搬家不是裁员；确属冗余才可删，worklog 逐条列"删除清单+理由"。

## 班规戒律（违反任意一条整单 FAIL）

1. 不许伪造引用（终审会逐字反查+md5 对比新旧文件）
2. 不许动 test-prompts.json、LICENSE、根 references/、docs/
3. 不许改 frontmatter name；不许改技能目录名
4. 不写"建议考虑/可灵活调整"类空话
5. 改评分离：自检只是工序，验收由 Claude 终审；worklog 不许写"已通过验收"
6. 一技能一 commit：`refactor(<skill-name>): slim SKILL.md <旧>→<新>`；整改单用 `fix(<skill-name>): <动作>`
7. P0 悬空修复：判断缺文件还是写错名；补建内容必须领域真实（样板=试产语文错因表）
8. worklog 写到仓库外运行目录，**绝对不许 commit 进 repo**（实案两起 revert + 一起捆带）
9. 原版没写清的规则不许赌：保守保留+worklog 列"待拍板疑问"
10. 全部完成后创建 runs/<TASK编号>/EXIT（一行完成摘要）即停，不越界跑下个批次

## 自检命令（回炉必跑）

```bash
cd /path/to/k12-education-skills
S=skills/<分区>/<skill-name>
wc -l $S/SKILL.md                          # ≤150
grep -oE '(references|schemas)/[A-Za-z0-9._/-]+\.(md|json|js)' $S/SKILL.md | sort -u | while read r; do [ -f "$S/$r" ] || echo "DANGLING $r"; done
for f in $S/references/*; do grep -q "$(basename $f)" $S/SKILL.md || echo "ORPHAN $f"; done
python3 -c "import json; json.load(open('$S/test-prompts.json'))"
```

## 验收体系（三闸口，GA 只负责过第一道）

1. **GA 自检**（工序，不可信）
2. **开卷终审**（批次门，跑 `bash pipeline/review.sh <subject|all>` + 实读抽查）
3. **闭卷抽考**（交付门，Claude 用 claude-review/test-cases/ 新旧同题对跑判教学动作）
