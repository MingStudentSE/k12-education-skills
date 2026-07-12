import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MODULES = ['k12-learning', 'llm-wiki', 'k12-automation', 'k12-skill-studio'];
export const FIXTURE_SCHEMA = join(ROOT, 'pipeline', 'module-behavior-fixture.schema.json');
export const RESPONSE_SCHEMA = join(ROOT, 'pipeline', 'module-behavior-response.schema.json');
export const OUTPUT_SCHEMA = join(ROOT, 'pipeline', 'module-behavior-output.schema.json');

const safetyPattern = /(?:授权|确认|同意|隐私|长期|档案|状态|写入|保存|删除|外传|外部|提醒|OCR|adapter|副作用|不得|禁止|不要|不应|不读取|不创建|不运行|不声称|失败|高敏|最小必要|立场|Raw)/i;
const legacyRuntimePattern = /(?:本\s*SKILL|跨\s*skill|目标\s*Skill|Skill\s*菜单|总路由|handover|hand-off|depends_on|交接|转交|跨技能|协调器)/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function activeRuntimeStrings(value, key = '') {
  if (key === 'source_skill') return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(item => activeRuntimeStrings(item));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([childKey, child]) => activeRuntimeStrings(child, childKey));
  }
  return [];
}

function normalizeAssertions(moduleName, source, key) {
  const hasSemantic = nonEmptyString(source.expected);
  const hasLists = Array.isArray(source.must_include) || Array.isArray(source.must_not_include);
  assert(hasSemantic !== hasLists, `${key}: expected exactly one expectation style`);

  if (hasSemantic) {
    const description = source.expected.trim();
    return [{
      id: 'expected-behavior',
      description,
      category: safetyPattern.test(description) ? 'safety' : 'user-visible',
    }];
  }

  assert(Array.isArray(source.must_include) && source.must_include.length > 0, `${key}: must_include must be non-empty`);
  assert(Array.isArray(source.must_not_include), `${key}: must_not_include must be an array`);
  const include = source.must_include.map((description, index) => {
    assert(nonEmptyString(description), `${key}: must_include[${index}] must be non-empty`);
    return {
      id: `include-${String(index + 1).padStart(2, '0')}`,
      description: `回答必须明确体现：${description.trim()}`,
      category: safetyPattern.test(description) ? 'safety' : 'user-visible',
    };
  });
  const exclude = source.must_not_include.map((description, index) => {
    assert(nonEmptyString(description), `${key}: must_not_include[${index}] must be non-empty`);
    return {
      id: `exclude-${String(index + 1).padStart(2, '0')}`,
      description: `回答不得采取、要求或声称：${description.trim()}`,
      category: 'safety',
    };
  });
  return [...include, ...exclude];
}

export function loadModuleBehaviorFixtures() {
  assert(existsSync(FIXTURE_SCHEMA), `missing fixture schema: ${FIXTURE_SCHEMA}`);
  assert(existsSync(RESPONSE_SCHEMA), `missing response schema: ${RESPONSE_SCHEMA}`);
  assert(existsSync(OUTPUT_SCHEMA), `missing live output schema: ${OUTPUT_SCHEMA}`);
  JSON.parse(readFileSync(FIXTURE_SCHEMA, 'utf8'));
  JSON.parse(readFileSync(RESPONSE_SCHEMA, 'utf8'));
  JSON.parse(readFileSync(OUTPUT_SCHEMA, 'utf8'));

  const cases = [];
  const counts = {};
  for (const moduleName of MODULES) {
    const moduleDir = join(ROOT, 'skills', moduleName);
    const skillPath = join(moduleDir, 'SKILL.md');
    const fixturePath = join(moduleDir, 'test-prompts.json');
    assert(existsSync(skillPath), `${moduleName}: missing SKILL.md interface`);
    assert(existsSync(fixturePath), `${moduleName}: missing test-prompts.json`);
    const sourceCases = JSON.parse(readFileSync(fixturePath, 'utf8'));
    assert(Array.isArray(sourceCases) && sourceCases.length > 0, `${moduleName}: fixture file must be a non-empty array`);
    counts[moduleName] = sourceCases.length;

    sourceCases.forEach((source, index) => {
      const key = `${moduleName}:${String(index + 1).padStart(3, '0')}:${source?.id || 'missing-id'}`;
      assert(source && typeof source === 'object' && !Array.isArray(source), `${key}: fixture must be an object`);
      assert(nonEmptyString(source.id), `${key}: id must be non-empty`);
      assert(nonEmptyString(source.prompt), `${key}: prompt must be non-empty`);
      const activeTexts = activeRuntimeStrings(source);
      assert(!activeTexts.some(value => legacyRuntimePattern.test(value)), `${key}: legacy Skill runtime semantics remain outside source_skill provenance`);
      const assertions = normalizeAssertions(moduleName, source, key);
      assert(new Set(assertions.map(item => item.id)).size === assertions.length, `${key}: assertion ids must be unique`);
      cases.push({
        module: moduleName,
        caseKey: key,
        shortSelector: `${moduleName}:${source.id}`,
        id: source.id,
        prompt: source.prompt.trim(),
        assertions,
        sourceIndex: index,
        hasRouteExpectation: Boolean(source.expected_route),
        provenance: nonEmptyString(source.source_skill) ? {
          legacySource: source.source_skill.trim(),
          sourceCase: source.source_case ?? null,
        } : null,
      });
    });
  }

  assert(new Set(cases.map(item => item.caseKey)).size === cases.length, 'normalized behavior case keys must be unique');
  // Every natural-language prompt is a user-visible module behavior fixture.
  // Structured route fixtures are an overlapping white-box subset, not an
  // alternative suite: routing correctness cannot replace response/safety checks.
  const behaviorCases = [...cases];
  const routeCases = cases.filter(item => item.hasRouteExpectation);
  const behaviorCounts = Object.fromEntries(MODULES.map(moduleName => [
    moduleName,
    behaviorCases.filter(item => item.module === moduleName).length,
  ]));
  for (const moduleName of MODULES) {
    const moduleCases = behaviorCases.filter(item => item.module === moduleName);
    assert(moduleCases.length > 0, `${moduleName}: needs user-visible response coverage`);
    assert(moduleCases.some(item => item.assertions.some(assertion => assertion.category === 'safety')), `${moduleName}: needs safety behavior coverage`);
  }

  const assertionCount = behaviorCases.reduce((total, item) => total + item.assertions.length, 0);
  const provenanceCount = cases.filter(item => item.provenance).length;
  const safetyAssertionCount = behaviorCases.reduce(
    (total, item) => total + item.assertions.filter(assertion => assertion.category === 'safety').length,
    0,
  );
  return {
    cases,
    behaviorCases,
    routeCases,
    counts,
    behaviorCounts,
    assertionCount,
    safetyAssertionCount,
    provenanceCount,
  };
}

export function resolveCaseSelectors(allCases, selectors) {
  const selected = [];
  for (const selector of selectors) {
    const exact = allCases.filter(item => item.caseKey === selector);
    const short = allCases.filter(item => item.shortSelector === selector);
    const matches = exact.length ? exact : short;
    assert(matches.length > 0, `unknown behavior case selector: ${selector}`);
    assert(matches.length === 1, `ambiguous selector ${selector}; use one of: ${matches.map(item => item.caseKey).join(', ')}`);
    selected.push(matches[0]);
  }
  return [...new Map(selected.map(item => [item.caseKey, item])).values()];
}

export function validateGeneratedBatch(batchCases, output) {
  assert(output && typeof output === 'object' && !Array.isArray(output), 'generated output must be an object');
  const moduleName = batchCases[0]?.module;
  assert(moduleName && batchCases.every(item => item.module === moduleName), 'a generated batch must contain one module');
  assert(output.module === moduleName, `expected generated module ${moduleName}, got ${output.module}`);
  assert(Array.isArray(output.results), `${moduleName}: generated results must be an array`);
  assert(output.results.length === batchCases.length, `${moduleName}: expected ${batchCases.length} generated responses, got ${output.results.length}`);
  const byKey = new Map(output.results.map(item => [item?.caseKey, item]));
  assert(byKey.size === output.results.length, `${moduleName}: duplicate generated caseKey`);
  for (const fixture of batchCases) {
    const result = byKey.get(fixture.caseKey);
    assert(result, `${fixture.caseKey}: missing generated response`);
    assert(nonEmptyString(result.response), `${fixture.caseKey}: generated user-visible response is empty`);
  }
  return byKey;
}

export function validateLiveBatch(batchCases, generatedByKey, output) {
  assert(output && typeof output === 'object' && !Array.isArray(output), 'live output must be an object');
  const moduleName = batchCases[0]?.module;
  assert(moduleName && batchCases.every(item => item.module === moduleName), 'a live batch must contain one module');
  assert(output.module === moduleName, `expected output module ${moduleName}, got ${output.module}`);
  assert(Array.isArray(output.results), `${moduleName}: results must be an array`);
  assert(output.results.length === batchCases.length, `${moduleName}: expected ${batchCases.length} results, got ${output.results.length}`);
  const byKey = new Map(output.results.map(item => [item?.caseKey, item]));
  assert(byKey.size === output.results.length, `${moduleName}: duplicate result caseKey`);
  const failures = [];

  for (const fixture of batchCases) {
    const result = byKey.get(fixture.caseKey);
    if (!result) {
      failures.push(`${fixture.caseKey}: missing result`);
      continue;
    }
    if (!nonEmptyString(result.response)) failures.push(`${fixture.caseKey}: user-visible response is empty`);
    const frozen = generatedByKey.get(fixture.caseKey)?.response;
    if (result.response !== frozen) failures.push(`${fixture.caseKey}: evaluator changed the frozen response`);
    if (!Array.isArray(result.checks)) {
      failures.push(`${fixture.caseKey}: checks must be an array`);
      continue;
    }
    const checks = new Map(result.checks.map(item => [item?.assertionId, item]));
    if (checks.size !== result.checks.length) failures.push(`${fixture.caseKey}: duplicate assertion result`);
    if (checks.size !== fixture.assertions.length) failures.push(`${fixture.caseKey}: expected ${fixture.assertions.length} checks, got ${checks.size}`);
    for (const assertion of fixture.assertions) {
      const check = checks.get(assertion.id);
      if (!check) {
        failures.push(`${fixture.caseKey}/${assertion.id}: missing check`);
        continue;
      }
      if (check.passed !== true) failures.push(`${fixture.caseKey}/${assertion.id}: failed — ${assertion.description}`);
      if (!nonEmptyString(check.evidence)) {
        failures.push(`${fixture.caseKey}/${assertion.id}: passing check needs quoted response evidence`);
      } else if (nonEmptyString(result.response) && !result.response.includes(check.evidence)) {
        failures.push(`${fixture.caseKey}/${assertion.id}: evidence is not an exact substring of response`);
      }
    }
  }
  return failures;
}
