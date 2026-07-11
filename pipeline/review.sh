#!/bin/bash
# Four Product Module quality gate — usage: bash pipeline/review.sh [all]
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO="$ROOT/skills/k12-automation/scripts/nightline"
FAILCNT=0

run_check() {
  local label="$1"
  shift
  if "$@"; then
    echo "  [$label] OK"
  else
    echo "  [$label] FAIL"
    FAILCNT=$((FAILCNT+1))
  fi
}

echo "===== PRODUCT MODULE CHECKS ====="
run_check "1 MODULE-CONTRACT" node "$ROOT/pipeline/validate_modules.mjs"
run_check "2 SCHEMA-CONTRACTS" python3 "$ROOT/pipeline/validate_schemas.py"

syntax_bad=0
for file in "$AUTO"/*.mjs "$ROOT"/pipeline/*.mjs; do
  node --check "$file" >/dev/null 2>&1 || { echo "  syntax fail: $file"; syntax_bad=1; }
done
if [ "$syntax_bad" -eq 0 ]; then echo "  [3 SYNTAX] OK"; else echo "  [3 SYNTAX] FAIL"; FAILCNT=$((FAILCNT+1)); fi

for marker in DIAGNOSIS ARCHIVE PROBLEMS SOLUTIONS; do
  grep -q "<<<$marker>>>" "$AUTO/night-run.mjs" || { echo "  missing night marker: $marker"; FAILCNT=$((FAILCNT+1)); }
done
echo "  [4 NIGHT-MARKERS] OK"

privacy_bad=0
for ignored_path in skills/k12-automation/scripts/nightline/config.json dashboard.html logs/test.log students/demo/profile.md; do
  git -C "$ROOT" check-ignore -q "$ignored_path" || { echo "  privacy ignore fail: $ignored_path"; privacy_bad=1; }
done
if [ "$privacy_bad" -eq 0 ]; then echo "  [5 PRIVACY-IGNORE] OK"; else echo "  [5 PRIVACY-IGNORE] FAIL"; FAILCNT=$((FAILCNT+1)); fi

echo "===== RUNTIME CHECKS ====="
run_check "6 AUTHORIZATION" node "$ROOT/pipeline/validate_authorization.mjs"
run_check "7 BUSINESS-TIME" node "$ROOT/pipeline/validate_business_time.mjs"
run_check "8 NIGHT-CLI" node "$ROOT/pipeline/night-cli-smoke.mjs"
run_check "9 SERVER-SMOKE" node "$ROOT/pipeline/server-smoke.mjs"

tmp="$(mktemp -d)"
mkdir -p "$tmp/students/demo/inbox"
cat > "$tmp/students/demo/profile.md" <<'EOF'
---
id: demo
authorized: true
authorized_by: 回归测试夹具（仅临时目录）
authorization_subject: guardian
authorization_date: 2026-07-11
authorization_method: written
external_processing_authorized: false
external_processing_provider:
external_processing_scope:
external_processing_authorization_date:
---

# Mock 学生画像
EOF
cat > "$tmp/students/demo/inbox/sample.md" <<'EOF'
---
subject: chemistry
---

Fe + O2 -> FeO
EOF
business_day="$(node --input-type=module -e "import {businessDate} from '$AUTO/business-time.mjs'; console.log(businessDate())")"
if K12_ROOT="$tmp" K12_STUDENTS_DIR="$tmp/students" K12_LOG_DIR="$tmp/logs" K12_LEARNING_DIR="$ROOT/skills/k12-learning" K12_MOCK_LLM=1 node "$AUTO/night-run.mjs" --student demo >/tmp/k12-night-mock.log 2>&1 \
  && [ -f "$tmp/students/demo/outbox/$business_day/sample-错因诊断.md" ] \
  && [ -f "$tmp/students/demo/outbox/$business_day/sample-变式训练题.md" ] \
  && [ -f "$tmp/students/demo/outbox/$business_day/sample-答案与讲解.md" ] \
  && [ -f "$tmp/students/demo/outbox/$business_day/晨报.md" ] \
  && ls "$tmp/students/demo/archive"/错题-*.md >/dev/null 2>&1; then
  echo "  [10 NIGHT-MOCK] OK"
else
  echo "  [10 NIGHT-MOCK] FAIL"
  sed -n '1,120p' /tmp/k12-night-mock.log 2>/dev/null || true
  FAILCNT=$((FAILCNT+1))
fi
rm -rf "$tmp"

if grep -RqsE --exclude-dir=node_modules '\[TODO|TODO:' "$ROOT/skills"; then
  echo "  [11 PLACEHOLDER] FAIL"
  FAILCNT=$((FAILCNT+1))
else
  echo "  [11 PLACEHOLDER] OK"
fi

echo "===== SUMMARY: Product Module failures $FAILCNT ====="
[ "$FAILCNT" -eq 0 ]
