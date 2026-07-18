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


def validate_dna_concept_graph_semantics(profile: dict) -> None:
    """Enforce graph invariants JSON Schema cannot express portably."""
    graph = profile.get("growthMap", {}).get("conceptGraph")
    if not graph:
        return
    node_ids = [node["nodeId"] for node in graph["nodes"]]
    if len(node_ids) != len(set(node_ids)):
        raise AssertionError("Learning DNA conceptGraph nodeId 必须唯一")
    known_nodes = set(node_ids)
    for edge in graph["edges"]:
        if edge["sourceNodeId"] not in known_nodes or edge["targetNodeId"] not in known_nodes:
            raise AssertionError("Learning DNA conceptGraph edge 必须引用图内节点")


def expect_graph_semantic_failure(profile: dict, message: str) -> None:
    try:
        validate_dna_concept_graph_semantics(profile)
    except AssertionError:
        return
    raise AssertionError(message)


def dna_example() -> None:
    base = LEARNING / "references/playbooks/general/learning-dna/schemas"
    check = validator(load(base / "dna-profile.schema.json"))
    example = load(base / "examples/full-profile.example.json")
    check.validate(example)

    graph = example.get("growthMap", {}).get("conceptGraph")
    if not graph:
        raise AssertionError("Learning DNA 完整示例必须覆盖 conceptGraph")
    validate_dna_concept_graph_semantics(example)
    mastery_levels = {node["masteryLevel"] for node in graph["nodes"]}
    if mastery_levels != {"会复述", "会解释", "真正掌握"}:
        raise AssertionError("Learning DNA 完整示例必须覆盖三档掌握层级")
    relation_types = {edge["relationType"] for edge in graph["edges"]}
    if relation_types != {"requires", "isParentOf", "appliesTo", "correlatesWith"}:
        raise AssertionError("Learning DNA 完整示例必须覆盖四类 conceptGraph 关系")

    legacy = load(base / "examples/legacy-profile-v1.2.example.json")
    if "knowledgeAccumulationTree" not in legacy.get("growthMap", {}):
        raise AssertionError("Learning DNA v1.2 兼容示例必须覆盖 knowledgeAccumulationTree")
    if "conceptGraph" in legacy.get("growthMap", {}):
        raise AssertionError("Learning DNA v1.2 兼容示例不得双写 conceptGraph")
    check.validate(legacy)

    legacy_long_value = json.loads(json.dumps(legacy, ensure_ascii=False))
    legacy_long_value["growthMap"]["knowledgeAccumulationTree"][0]["pointA"]["knowledge"] = "旧" * 121
    check.validate(legacy_long_value)

    legacy_with_graph = json.loads(json.dumps(legacy, ensure_ascii=False))
    legacy_with_graph["growthMap"]["conceptGraph"] = graph
    if check.is_valid(legacy_with_graph):
        raise AssertionError("Learning DNA v1.2 档案不得携带 conceptGraph")

    current_with_legacy_tree = json.loads(json.dumps(example, ensure_ascii=False))
    current_with_legacy_tree["growthMap"]["knowledgeAccumulationTree"] = legacy["growthMap"]["knowledgeAccumulationTree"]
    if check.is_valid(current_with_legacy_tree):
        raise AssertionError("Learning DNA v1.3 档案不得双写 knowledgeAccumulationTree")

    duplicate_node = json.loads(json.dumps(example, ensure_ascii=False))
    duplicate_node["growthMap"]["conceptGraph"]["nodes"][1]["nodeId"] = duplicate_node["growthMap"]["conceptGraph"]["nodes"][0]["nodeId"]
    expect_graph_semantic_failure(duplicate_node, "Learning DNA 保存前校验必须拒绝重复 nodeId")

    dangling_edge = json.loads(json.dumps(example, ensure_ascii=False))
    dangling_edge["growthMap"]["conceptGraph"]["edges"][0]["targetNodeId"] = "MissingNode"
    expect_graph_semantic_failure(dangling_edge, "Learning DNA 保存前校验必须拒绝悬空 edge")

    graph_without_consent = json.loads(json.dumps(example, ensure_ascii=False))
    graph_without_consent["meta"]["consentStatus"]["profileEnabled"] = False
    if check.is_valid(graph_without_consent):
        raise AssertionError("Learning DNA conceptGraph 持久化必须要求 profileEnabled=true")

    unnamespaced_error_code = json.loads(json.dumps(example, ensure_ascii=False))
    unnamespaced_error_code["errorPatterns"]["fixedErrorTypes"][0]["primarySubtypeId"] = "B03"
    if check.is_valid(unnamespaced_error_code):
        raise AssertionError("Learning DNA 持久化错因 ID 必须带学科命名空间")


def curriculum_evidence_examples() -> int:
    base = LEARNING / "references/curriculum/2022"
    standards_check = validator(load(LEARNING / "schemas/curriculum-standards.schema.json"))
    evidence_check = validator(load(LEARNING / "schemas/core-competency-evidence-model.schema.json"))
    standards_check.validate(load(base / "standards.json"))
    profiles = sorted((base / "evidence").glob("*.json"))
    if len(profiles) != 9:
        raise AssertionError(f"2022 证据模型必须恰有 9 个当前学科 profile，实际 {len(profiles)}")
    for path in profiles:
        evidence_check.validate(load(path))
    return len(profiles)


def curriculum_output_contract() -> None:
    check = validator(load(ROOT / "pipeline/curriculum-evidence-output.schema.json"))
    constraints = {
        "sessionOnly": True,
        "noStateWrite": True,
        "singleObservationIsMastery": False,
        "maxSelectedModels": 1,
        "noExtraAssessment": True,
        "studentActionRequired": True,
        "maxShortActions": None,
    }
    applies = {
        "scopeStatus": "applies",
        "standardId": "cn-compulsory-2022",
        "routeSubject": "history",
        "subjectId": "history",
        "competencyId": "history.source-evidence",
        "modelId": "history.source-evidence.claim-support.v1",
        "sourceEvidence": {
            "standardUrl": "https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582345700037.pdf",
            "section": "三、课程目标 / （一）核心素养内涵",
            "pdfPage": 11,
            "sha256": "c807b9162d7f7a652c9acedc187c39b28d29b73edfa9e6964045f9a8672a90ef",
        },
        "observableEvidence": ["能引用相关信息并说明它如何支持结论"],
        "learningTask": {
            "instruction": "为当前结论补一条材料证据和一个证明限度。",
            "successCriteria": ["结论与证据逐项绑定", "没有超出材料范围"],
        },
        "feedbackAdjustment": {
            "whenMissing": "退回证据—说明—结论句架。",
            "whenEmerging": "补材料编号和证明限度。",
            "whenDemonstrated": "加入不同来源材料做互证。",
            "retest": "用新材料完成同一证据链。",
        },
        "scopeNote": "适用于初中历史的 2022 义务教育课程标准。",
        "constraints": constraints,
    }
    out_of_scope = {
        "scopeStatus": "out-of-scope",
        "standardId": None,
        "routeSubject": "politics",
        "subjectId": None,
        "competencyId": None,
        "modelId": None,
        "sourceEvidence": None,
        "observableEvidence": [],
        "learningTask": None,
        "feedbackAdjustment": None,
        "scopeNote": "高二不属于 2022 义务教育课标适用范围。",
        "constraints": constraints,
    }
    unsupported_route = {
        **out_of_scope,
        "scopeStatus": "unsupported-route",
        "routeSubject": "science",
        "scopeNote": "当前没有小学科学专用证据模型，不能冒充 2022 科学课程对齐。",
    }
    check.validate(applies)
    check.validate(out_of_scope)
    check.validate(unsupported_route)
    invalid = [
        {**applies, "standardId": None},
        {**applies, "constraints": {**constraints, "singleObservationIsMastery": True}},
        {**out_of_scope, "modelId": "history.source-evidence.claim-support.v1"},
    ]
    for index, value in enumerate(invalid, start=1):
        if check.is_valid(value):
            raise AssertionError(f"curriculum output invalid fixture {index} was accepted")


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
            raise AssertionError(f"{name} 缺少自然语言 prompt fixture")


def behavior_fixture_contract() -> int:
    fixture_schema = load(ROOT / "pipeline/module-behavior-fixture.schema.json")
    fixture_check = validator(fixture_schema)
    validator(load(ROOT / "pipeline/module-behavior-response.schema.json"))
    validator(load(ROOT / "pipeline/module-behavior-output.schema.json"))
    validator(load(ROOT / "pipeline/v3-route-output.schema.json"))
    validator(load(ROOT / "pipeline/v3-route-batch-output.schema.json"))
    count = 0
    for name in ["k12-learning", "llm-wiki", "k12-automation", "k12-skill-studio"]:
        for index, case in enumerate(load(ROOT / f"skills/{name}/test-prompts.json"), start=1):
            try:
                fixture_check.validate(case)
            except Exception as exc:
                raise AssertionError(f"{name} prompt fixture #{index} 不符合共享 schema: {exc}") from exc
            count += 1
    return count


def main() -> None:
    schemas = sorted(
        path for path in ROOT.glob("skills/**/schemas/*.schema.json")
        if "node_modules" not in path.parts
    )
    for path in schemas:
        validator(load(path))
    module_contract()
    behavior_fixtures = behavior_fixture_contract()
    decision_cases = decision_contract()
    intake_example()
    dna_example()
    curriculum_profiles = curriculum_evidence_examples()
    curriculum_output_contract()
    print(f"schema validation: 4 modules; {len(schemas)} module schemas; {behavior_fixtures} prompt fixtures share one schema; 58 capabilities; {decision_cases} decision cases; intake + DNA + {curriculum_profiles} curriculum profiles + curriculum output valid")


if __name__ == "__main__":
    main()
