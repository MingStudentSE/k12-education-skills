#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCurriculumEvidence } from '../skills/k12-learning/scripts/resolve-curriculum-evidence.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEARNING = join(ROOT, 'skills/k12-learning');
const CURRICULUM = join(LEARNING, 'references/curriculum/2022');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const load = path => JSON.parse(readFileSync(path, 'utf8'));

const index = load(join(CURRICULUM, 'index.json'));
const standards = load(join(CURRICULUM, 'standards.json'));
const capabilityMap = load(join(LEARNING, 'references/capability-map.json'));
const tests = load(join(LEARNING, 'test-prompts.json'));
const capabilityNames = new Set(capabilityMap.capabilities.map(item => item.name));

assert(index.standardId === 'cn-compulsory-2022', 'curriculum index must pin cn-compulsory-2022');
assert(index.scope === 'grades-1-9-only', '2022 curriculum index must remain grades 1-9 only');
assert(JSON.stringify(index.chain) === JSON.stringify(['core-competency', 'observable-evidence', 'learning-task', 'feedback-adjustment']), 'curriculum evidence chain drifted');
assert(index.resolver === '../../../scripts/resolve-curriculum-evidence.mjs', 'curriculum index must expose the canonical resolver');
assert(existsSync(join(CURRICULUM, index.resolver)), 'curriculum resolver target is missing');
assert(index.profiles.length === 9, `expected 9 evidence profiles, got ${index.profiles.length}`);
assert(existsSync(join(CURRICULUM, index.officialFacts)), 'curriculum officialFacts target is missing');
assert(existsSync(join(CURRICULUM, index.policy)), 'curriculum policy target is missing');
assert(new Set(index.profiles.map(item => item.routeSubject)).size === 9, 'profile route subjects must be unique');
assert(new Set(index.profiles.map(item => item.subjectId)).size === 9, 'profile subject ids must be unique');
assert(index.outOfScope.some(item => item.signal === 'senior-secondary'), 'high-school exclusion is missing');
assert(index.outOfScope.some(item => item.signal === 'primary-science'), 'primary Science coverage gap is missing');

const standard = standards.standard;
assert(standards.dataVersion === '1.2.0', 'curriculum official facts must use competency-locator version 1.2.0');
assert(standard.standardId === index.standardId, 'index and standards standardId mismatch');
assert(standard.educationStage === 'compulsory-education', '2022 facts must not claim high-school scope');
assert(standard.editionYear === 2022 && standard.effectiveFrom === '2022-09', '2022 version/effective date drifted');
assert(/^https:\/\/(?:www|hudong)\.moe\.gov\.cn\//.test(standard.noticeUrl), 'official notice must use an moe.gov.cn source');
assert(standards.coverage.status === 'supported-routes-only', 'coverage must not claim all 2022 subjects');
assert(standards.subjects.length === 9, `expected 9 current subject facts, got ${standards.subjects.length}`);

const subjectById = new Map();
const competencyById = new Map();
for (const subject of standards.subjects) {
  assert(!subjectById.has(subject.subjectId), `duplicate curriculum subject ${subject.subjectId}`);
  subjectById.set(subject.subjectId, subject);
  assert(subject.gradeRange.min >= 1 && subject.gradeRange.max <= 9, `${subject.subjectId}: grade range escapes compulsory education`);
  assert(subject.gradeRange.min <= subject.gradeRange.max, `${subject.subjectId}: invalid grade range`);
  assert(/^https:\/\/(?:www|hudong)\.moe\.gov\.cn\/.*\.pdf$/.test(subject.standardUrl), `${subject.subjectId}: standard source is not an official PDF`);
  assert(/^三、课程目标 \/ （一）核心素养内涵/.test(subject.sourceLocator?.section), `${subject.subjectId}: exact source section missing`);
  assert(Number.isInteger(subject.sourceLocator?.pdfPage) && subject.sourceLocator.pdfPage > 0, `${subject.subjectId}: PDF page locator missing`);
  assert(/^[a-f0-9]{64}$/.test(subject.sourceLocator?.sha256), `${subject.subjectId}: PDF content hash missing`);
  assert(subject.verificationStatus === 'primary-source-verified', `${subject.subjectId}: official names must be primary-source verified`);
  for (const competency of subject.competencies) {
    assert(Number.isInteger(competency.sourcePage) && competency.sourcePage >= subject.sourceLocator.pdfPage, `${competency.competencyId}: exact competency sourcePage missing or precedes section start`);
    assert(!competencyById.has(competency.competencyId), `duplicate official competency ${competency.competencyId}`);
    competencyById.set(competency.competencyId, { ...competency, subjectId: subject.subjectId });
  }
}

const ethics = subjectById.get('ethics-and-rule-of-law');
assert(ethics?.officialName === '道德与法治' && ethics.routeSubject === 'politics', 'politics alias must resolve to official 道德与法治');
assert(JSON.stringify(ethics.competencies.map(item => item.officialName)) === JSON.stringify(['政治认同', '道德修养', '法治观念', '健全人格', '责任意识']), '义务教育道德与法治五项核心素养漂移');
const biology = subjectById.get('biology');
assert(biology?.officialName === '生物学', 'official subject name must be 生物学');
const math = subjectById.get('math');
assert(math?.competencies.every(item => item.kind === 'top-level-manifestation' && item.stageManifestations), 'math must preserve 三会 above stage manifestations');
assert(standards.knownGaps.some(item => item.officialSubject === '科学' && item.status === 'not-modeled'), 'Science gap must remain explicit');

const profileFiles = new Set();
const modelById = new Map();
for (const entry of index.profiles) {
  const path = join(CURRICULUM, entry.file);
  assert(existsSync(path), `missing curriculum profile ${entry.file}`);
  profileFiles.add(relative(join(CURRICULUM, 'evidence'), path));
  const profile = load(path);
  const subject = subjectById.get(entry.subjectId);
  assert(subject, `profile references unknown subject ${entry.subjectId}`);
  assert(profile.standardId === index.standardId, `${entry.file}: standardId mismatch`);
  assert(profile.subjectId === entry.subjectId && profile.routeSubject === entry.routeSubject, `${entry.file}: index/profile identity mismatch`);
  assert(subject.routeSubject === profile.routeSubject, `${entry.file}: standards/profile route mismatch`);
  assert(profile.provenance === 'project-operationalization', `${entry.file}: evidence must not masquerade as official text`);
  assert(profile.evidencePolicy.singleObservationIsMastery === false, `${entry.file}: one observation cannot mean mastery`);
  assert(profile.evidencePolicy.firstUseMaxModels === 1, `${entry.file}: first use may select only one model`);
  assert(profile.evidencePolicy.transferRequired === true && profile.evidencePolicy.defaultState === 'session-only', `${entry.file}: transfer/state safety drifted`);
  for (const model of profile.models) {
    assert(!modelById.has(model.modelId), `duplicate evidence model ${model.modelId}`);
    const competency = competencyById.get(model.competencyId);
    assert(competency?.subjectId === profile.subjectId, `${model.modelId}: competency does not belong to profile subject`);
    assert(model.observableEvidence.length >= 2, `${model.modelId}: observable evidence missing`);
    assert(model.task?.promptContract && model.task.successCriteria?.length >= 2, `${model.modelId}: learning task incomplete`);
    for (const key of ['whenMissing', 'whenEmerging', 'whenDemonstrated', 'retest']) assert(model.feedbackAdjustment?.[key], `${model.modelId}: feedback ${key} missing`);
    assert(model.capabilityBindings.every(name => capabilityNames.has(name)), `${model.modelId}: unknown capability binding`);
    assert(model.capabilityBindings.some(name => capabilityMap.capabilities.find(item => item.name === name)?.subject === profile.routeSubject), `${model.modelId}: no same-subject capability binding`);
    modelById.set(model.modelId, { ...model, subjectId: profile.subjectId, routeSubject: profile.routeSubject });
    const resolved = resolveCurriculumEvidence({ routeSubject: profile.routeSubject, grade: subject.gradeRange.min, modelId: model.modelId });
    assert(resolved.scopeStatus === 'applies' && resolved.selectedModel?.modelId === model.modelId, `${model.modelId}: canonical resolver cannot select model`);
    assert(resolved.sourceEvidence?.sha256 === subject.sourceLocator.sha256, `${model.modelId}: resolver lost official PDF fingerprint`);
    assert(resolved.sourceEvidence?.pdfPage === competency.sourcePage, `${model.modelId}: resolver did not use the selected competency sourcePage`);
  }
}

const actualProfiles = readdirSync(join(CURRICULUM, 'evidence')).filter(name => name.endsWith('.json'));
assert(actualProfiles.length === 9, `unexpected evidence profile count ${actualProfiles.length}`);
assert(actualProfiles.every(name => profileFiles.has(name)), `orphan evidence profiles: ${actualProfiles.filter(name => !profileFiles.has(name))}`);
assert(modelById.size === competencyById.size, `every official competency needs one evidence model: models=${modelById.size}, competencies=${competencyById.size}`);
assert(resolveCurriculumEvidence({ routeSubject: 'math', grade: 10 }).scopeStatus === 'out-of-scope', 'resolver must reject high-school use of the 2022 model');
assert(resolveCurriculumEvidence({ routeSubject: 'math', grade: null }).scopeStatus === 'needs-context', 'resolver must require grade context before explicit alignment');
assert(resolveCurriculumEvidence({ routeSubject: 'science', grade: 5 }).scopeStatus === 'unsupported-route', 'resolver must preserve the current Science route gap');
assert(resolveCurriculumEvidence({ routeSubject: 'math', grade: 7, competencyId: 'math.express-world' }).sourceEvidence?.pdfPage === 13, 'math language competency must cite its exact PDF page 13');

const evidenceCases = tests.filter(test => test.expected_curriculum_evidence);
assert(evidenceCases.length >= 5, `need at least 5 curriculum behavior fixtures, got ${evidenceCases.length}`);
assert(new Set(evidenceCases.map(test => test.id)).size === evidenceCases.length, 'curriculum behavior fixture ids must be unique');
for (const test of evidenceCases) {
  const expected = test.expected_curriculum_evidence;
  assert(['applies', 'out-of-scope', 'needs-context', 'unsupported-route'].includes(expected.scopeStatus), `${test.id}: invalid scopeStatus`);
  assert(expected.firstUseMaxModels === 1 && expected.singleObservationIsMastery === false && expected.stateWriteAllowed === false, `${test.id}: evidence safety fixture drifted`);
  if (expected.scopeStatus === 'applies') {
    const model = modelById.get(expected.modelId);
    assert(model, `${test.id}: unknown expected model ${expected.modelId}`);
    assert(model.competencyId === expected.competencyId && model.subjectId === expected.subjectId && model.routeSubject === expected.routeSubject, `${test.id}: expected evidence identity mismatch`);
    assert(expected.standardId === index.standardId, `${test.id}: applicable case must use current standard`);
  } else {
    for (const key of ['standardId', 'subjectId', 'competencyId', 'modelId']) assert(expected[key] === null, `${test.id}: ${key} must be null when scope does not apply`);
  }
}

const learningSkill = readFileSync(join(LEARNING, 'SKILL.md'), 'utf8');
const policy = readFileSync(join(LEARNING, 'references/curriculum-evidence-policy.md'), 'utf8');
const politicsApplication = readFileSync(join(LEARNING, 'references/playbooks/politics/politics-application-coach/playbook.md'), 'utf8');
for (const marker of ['核心素养 → 可观测证据 → 学习任务 → 反馈调整', '2022 模型只适用于义务教育', '不创建新 capability']) assert(learningSkill.includes(marker), `k12-learning lost curriculum execution marker: ${marker}`);
for (const marker of ['高中请求不得标成“2022 新课标”', '一次观察只能形成会话内局部观察', '学习任务必须由学生执行', '首轮只提供一个线索', 'science-solving-four-steps', '项目操作化', '不要由 caller 自己拼接', '章节起始页', 'sourcePage', 'SHA-256']) assert(policy.includes(marker), `curriculum policy lost boundary: ${marker}`);
assert(politicsApplication.includes('首轮只给一个定位线索') && politicsApplication.includes('不得先列完权利、原理、程序或答案骨架'), 'politics application coach must wait for a student attempt');

console.log(`curriculum evidence: 1 official standard; ${standards.subjects.length} supported subjects; ${competencyById.size} competencies/models; ${evidenceCases.length} behavior fixtures`);
