#!/bin/bash
# K12 开卷终审五件套 —— 用法: bash pipeline/review.sh [subject|all]
# 当前仓库基础门：①行数 ②悬空/孤儿引用 ③JSON。
# 如存在旧基线目录（默认 ./backup-pre-fix，或 K12_BASELINE 指定），额外执行 ④关键词覆盖 ⑤锚点反查。
# 无旧基线时仍执行全局语义烟测：夜间四节输出、隐私 ignore、mock 产线回归。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE="${K12_BASELINE:-$ROOT/backup-pre-fix}"
SUBJECTS="${1:-all}"
if [ "$SUBJECTS" = "all" ]; then
  SUBJECTS="$(find "$ROOT/skills" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)"
fi

PASSCNT=0
FLAGCNT=0
FAILCNT=0
BASELINE_AVAILABLE=0
[ -d "$BASELINE/skills" ] && BASELINE_AVAILABLE=1

for sub in $SUBJECTS; do
  if [ ! -d "$ROOT/skills/$sub" ]; then
    echo "!! $sub SUBJECT_DIR_MISSING"
    FAILCNT=$((FAILCNT+1))
    continue
  fi

  for new in "$ROOT/skills/$sub"/*/; do
    [ -d "$new" ] || continue
    sk="$(basename "$new")"
    old="$BASELINE/skills/$sub/$sk"
    echo "===== $sub/$sk ====="

    lines="$(wc -l < "$new/SKILL.md")"
    if [ "$lines" -le 150 ]; then
      echo "  [1]LINES $lines OK"
    else
      echo "  [1]LINES $lines FAIL>150"
      FAILCNT=$((FAILCNT+1))
    fi

    bad=0
    while IFS= read -r ref; do
      [ -z "$ref" ] && continue
      [ -f "$new/$ref" ] || { echo "  [2]DANGLING $ref"; bad=1; }
    done < <(grep -oE '(references|schemas)/[A-Za-z0-9._/-]+\.(md|json|js)' "$new/SKILL.md" | sort -u)
    if [ -d "$new/references" ]; then
      for f in "$new"/references/*; do
        [ -f "$f" ] || continue
        grep -q "$(basename "$f")" "$new/SKILL.md" || { echo "  [2]ORPHAN $(basename "$f")"; bad=1; }
      done
    fi
    if [ "$bad" -eq 0 ]; then
      echo "  [2]REFS OK"
    else
      FAILCNT=$((FAILCNT+1))
    fi

    if python3 -c "import json; json.load(open('$new/test-prompts.json'))" 2>/dev/null; then
      echo "  [3]JSON OK"
    else
      echo "  [3]JSON FAIL"
      FAILCNT=$((FAILCNT+1))
    fi

    if [ "$BASELINE_AVAILABLE" -eq 0 ] || [ ! -f "$old/SKILL.md" ]; then
      echo "  [4]KEYWORDS skip（无旧基线：${BASELINE}）"
      echo "  [5]ANCHOR skip（无旧基线）"
      [ "$bad" -eq 0 ] && [ "$lines" -le 150 ] && PASSCNT=$((PASSCNT+1))
      continue
    fi

    tmp="$(mktemp)"
    miss="$(mktemp)"
    python3 -c 'import re,sys;print("\n".join(sorted(set(re.findall(r"[一-龥]{4,}",open(sys.argv[1],encoding="utf-8").read())))))' "$old/SKILL.md" > "$tmp"
    total="$(wc -l < "$tmp")"
    while IFS= read -r kw; do
      grep -rqF --exclude=test-prompts.json "$kw" "$new" || echo "$kw" >> "$miss"
    done < "$tmp"
    m=0
    [ -s "$miss" ] && m="$(wc -l < "$miss")"
    pct=0
    [ "$total" -gt 0 ] && pct=$((m*100/total))
    echo "  [4]KEYWORDS missing $m/$total (${pct}%)"

    if [ "$pct" -ge 5 ]; then
      FLAGCNT=$((FLAGCNT+1))
      echo "  [5]ANCHOR（重写型，LOST 项需人工实读）:"
      grep -E '^#{2,3} ' "$old/SKILL.md" | while IFS= read -r h; do
        t="$(echo "$h" | sed -E 's/^#+ +//; s/^[一二三四五六七八九十]+、//; s/^[0-9.、]+ *//')"
        if grep -rqF --exclude=test-prompts.json "$t" "$new"; then
          :
        else
          k="$(python3 -c 'import re,sys;print((re.findall(r"[一-龥]{4,}",sys.argv[1]) or [""])[0])' "$t")"
          if [ -n "$k" ] && grep -rqF --exclude=test-prompts.json "$k" "$new"; then
            echo "    PART $t"
          else
            echo "    LOST $t"
          fi
        fi
      done
    else
      PASSCNT=$((PASSCNT+1))
      echo "  [5]ANCHOR skip（搬家型放行）"
    fi

    if [ -d "$new/references" ]; then
      for f in "$new"/references/*; do
        [ -f "$f" ] || continue
        b="$(basename "$f")"
        o="$old/references/$b"
        [ -f "$o" ] && cmp -s "$f" "$o" && echo "  [P]UNCHANGED-REF $b（若主文件声称新内容在此文件，必须人工 grep 核实）"
      done
    fi
    rm -f "$tmp" "$miss"
  done
done

echo "===== GLOBAL SEMANTIC CHECKS ====="
semantic_bad=0
for marker in DIAGNOSIS ARCHIVE PROBLEMS SOLUTIONS; do
  if grep -q "<<<$marker>>>" "$ROOT/engine/night-run.mjs"; then
    echo "  [6]NIGHT-MARKER $marker OK"
  else
    echo "  [6]NIGHT-MARKER $marker FAIL"
    semantic_bad=1
  fi
done

privacy_bad=0
for ignored_path in engine/config.json dashboard.html logs/test.log students/demo/profile.md; do
  git -C "$ROOT" check-ignore -q "$ignored_path" || { echo "  [7]PRIVACY-IGNORE $ignored_path FAIL"; privacy_bad=1; }
done
if [ "$privacy_bad" -eq 0 ]; then
  echo "  [7]PRIVACY-IGNORE OK"
else
  semantic_bad=1
fi

tmp="$(mktemp -d)"
mkdir -p "$tmp/students/demo/inbox"
cat > "$tmp/students/demo/profile.md" <<'EOF'
---
id: demo
authorized: true
---

# Mock 学生画像
EOF
cat > "$tmp/students/demo/inbox/sample.md" <<'EOF'
---
subject: chemistry
---

Fe + O2 -> FeO
EOF
if K12_ROOT="$ROOT" K12_STUDENTS_DIR="$tmp/students" K12_LOG_DIR="$tmp/logs" K12_MOCK_LLM=1 node "$ROOT/engine/night-run.mjs" --student demo >/tmp/k12-night-mock.log 2>&1 \
  && [ -f "$tmp/students/demo/outbox/$(date +%F)/sample-错因诊断.md" ] \
  && [ -f "$tmp/students/demo/outbox/$(date +%F)/sample-变式训练题.md" ] \
  && [ -f "$tmp/students/demo/outbox/$(date +%F)/sample-答案与讲解.md" ] \
  && [ -f "$tmp/students/demo/outbox/$(date +%F)/晨报.md" ] \
  && ls "$tmp/students/demo/archive"/错题-*.md >/dev/null 2>&1 \
  && ls "$tmp/students/demo/inbox/processed"/*sample.md >/dev/null 2>&1; then
  echo "  [8]NIGHT-MOCK OK"
else
  echo "  [8]NIGHT-MOCK FAIL"
  sed -n '1,120p' /tmp/k12-night-mock.log 2>/dev/null || true
  semantic_bad=1
fi
rm -rf "$tmp"

if [ "$semantic_bad" -ne 0 ]; then
  FAILCNT=$((FAILCNT+1))
fi

echo "===== SUMMARY: 基础/搬家型通过 $PASSCNT, 需实读 $FLAGCNT, 基础失败 $FAILCNT ====="
[ "$FAILCNT" -eq 0 ]
