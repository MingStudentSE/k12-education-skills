#!/usr/bin/env python3
"""Compile Product Module schemas and run contract-focused fixtures."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    from jsonschema import FormatChecker
    from jsonschema.validators import validator_for
except ImportError:
    print("缺少 jsonschema：先运行 python3 -m pip install -r pipeline/requirements.txt", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[1]
LEARNING = ROOT / "skills/k12-learning"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def validator(schema: dict):
    cls = validator_for(schema)
    cls.check_schema(schema)
    return cls(schema, format_checker=FormatChecker())


def decision_contract() -> int:
    schema = load(LEARNING / "schemas/playbook-decision.schema.json")
    capability_map = load(LEARNING / "references/capability-map.json")
    tests = load(LEARNING / "test-prompts.json")
    capabilities = capability_map["capabilities"]
    names = [item["name"] for item in capabilities]
    if capability_map["capabilityCount"] != 58 or len(names) != 58 or len(set(names)) != 58:
        raise AssertionError("capability map 必须恰有 58 个唯一内部能力")
    for item in capabilities:
        path = LEARNING / item["playbook"]
        if not path.is_file():
            raise AssertionError(f"capability playbook 不存在: {item['name']} -> {item['playbook']}")
        match = re.search(r"^name:\s*(.+)$", path.read_text(encoding="utf-8"), re.M)
        if not match or match.group(1).strip() != item["name"]:
            raise AssertionError(f"capability 名称与 playbook 不一致: {item['name']}")

    covered = {
        case.get("expected_route", {}).get("primaryPlaybook")
        for case in tests
        if isinstance(case, dict)
    }
    missing = sorted(set(names) - covered)
    if missing:
        raise AssertionError(f"迁移后的路由行为测试未覆盖 playbook: {missing}")

    check = validator(schema)
    constraints = {
        "sessionOnly": True,
        "noStateRead": True,
        "noStateWrite": True,
        "noAutomation": True,
        "noSilentInstall": True,
    }
    base = {
        "mode": "DIRECT",
        "primaryPlaybook": "math-problem-solving-coach",
        "supportingPlaybooks": [],
        "confidence": "high",
        "matchedSignals": ["数学", "当前步骤"],
        "constraints": constraints,
        "moduleRequired": None,
        "clarification": None,
    }
    cases = [
        ("direct", base, True),
        ("intake", {**base, "mode": "INTAKE", "primaryPlaybook": "student-quick-assessment"}, True),
        ("compose", {**base, "mode": "COMPOSE", "supportingPlaybooks": ["science-solving-four-steps", "feynman-learning"]}, True),
        ("clarify", {**base, "mode": "CLARIFY", "primaryPlaybook": None, "clarification": "你想解当前题，还是分析反复错因？"}, True),
        ("ordinary", {**base, "mode": "ORDINARY", "primaryPlaybook": None}, True),
        ("module", {**base, "mode": "MODULE_REQUIRED", "primaryPlaybook": None, "moduleRequired": "llm-wiki"}, True),
        ("direct-support", {**base, "supportingPlaybooks": ["feynman-learning"]}, False),
        ("compose-empty", {**base, "mode": "COMPOSE"}, False),
        ("clarify-no-question", {**base, "mode": "CLARIFY", "primaryPlaybook": None}, False),
        ("ordinary-playbook", {**base, "mode": "ORDINARY"}, False),
        ("bad-module", {**base, "mode": "MODULE_REQUIRED", "primaryPlaybook": None, "moduleRequired": "made-up"}, False),
        ("extra-pii", {**base, "phone": "13800138000"}, False),
    ]
    for name, value, expected in cases:
        got = check.is_valid(value)
        if got != expected:
            raise AssertionError(f"playbook decision {name}: expected={expected}, got={got}")
        if got:
            selected = [value.get("primaryPlaybook"), *value.get("supportingPlaybooks", [])]
            unknown = [item for item in selected if item and item not in names]
            if unknown:
                raise AssertionError(f"playbook decision {name} 选择未知实现: {unknown}")

    structured_routes = [case for case in tests if isinstance(case, dict) and case.get("expected_route")]
    for case in structured_routes:
        route = case["expected_route"]
        mode = route["mode"]
        canonical = {
            "mode": mode,
            "primaryPlaybook": route.get("primaryPlaybook"),
            "supportingPlaybooks": route.get("supportingPlaybooks", []),
            "confidence": "high",
            "matchedSignals": ["regression fixture"],
            "constraints": constraints,
            "moduleRequired": route.get("moduleRequired"),
            "clarification": "需要一个最小澄清问题" if mode == "CLARIFY" else None,
        }
        try:
            check.validate(canonical)
        except Exception as exc:
            raise AssertionError(f"route fixture {case.get('id')} 不能形成合法 decision: {exc}") from exc
    return len(cases)


def intake_example() -> None:
    base = LEARNING / "references/playbooks/general/student-quick-assessment"
    schema = load(base / "schemas/intake-persona.schema.json")
    text = (base / "references/persona-template.md").read_text(encoding="utf-8")
    blocks = re.findall(r"```json\n([\s\S]*?)```", text)
    if len(blocks) != 1:
        raise AssertionError("persona-template.md 必须恰有一个 JSON 示例")
    validator(schema).validate(json.loads(blocks[0]))


def dna_example() -> None:
    base = LEARNING / "references/playbooks/general/learning-dna/schemas"
    validator(load(base / "dna-profile.schema.json")).validate(load(base / "examples/full-profile.example.json"))


def module_contract() -> None:
    expected = {"k12-learning", "llm-wiki", "k12-automation", "k12-skill-studio"}
    actual = {path.parent.name for path in (ROOT / "skills").glob("*/SKILL.md")}
    if actual != expected:
        raise AssertionError(f"Product Module 集合不一致: expected={sorted(expected)}, actual={sorted(actual)}")
    nested = [path for path in (ROOT / "skills").glob("**/SKILL.md") if path.parent.name not in expected]
    if nested:
        raise AssertionError(f"发现额外可发现 Skill interface: {[str(p.relative_to(ROOT)) for p in nested]}")
    for name in expected:
        tests = load(ROOT / f"skills/{name}/test-prompts.json")
        if not isinstance(tests, list) or not tests:
            raise AssertionError(f"{name} 缺少 module 级行为测试")


def main() -> None:
    schemas = sorted(
        path for path in ROOT.glob("skills/**/schemas/*.schema.json")
        if "node_modules" not in path.parts
    )
    for path in schemas:
        validator(load(path))
    module_contract()
    decision_cases = decision_contract()
    intake_example()
    dna_example()
    print(f"schema validation: 4 modules; {len(schemas)} schemas; 58 capabilities; {decision_cases} decision cases; intake + DNA examples valid")


if __name__ == "__main__":
    main()
