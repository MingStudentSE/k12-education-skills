#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const CURRICULUM_ROOT = join(MODULE_ROOT, 'references/curriculum/2022');
const load = path => JSON.parse(readFileSync(path, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function resolveCurriculumEvidence(input, root = CURRICULUM_ROOT) {
  const { routeSubject, grade = null, modelId = null, competencyId = null } = input;
  assert(typeof routeSubject === 'string' && routeSubject.length > 0, 'routeSubject is required');
  assert(modelId === null || competencyId === null, 'choose modelId or competencyId, not both');
  assert(grade === null || (Number.isInteger(grade) && grade >= 1 && grade <= 12), 'grade must be an integer from 1 to 12 or null');

  const index = load(join(root, 'index.json'));
  const entry = index.profiles.find(item => item.routeSubject === routeSubject);
  if (!entry) {
    return {
      scopeStatus: 'unsupported-route',
      standardId: null,
      routeSubject,
      subject: null,
      selectedModel: null,
      candidates: [],
      scopeNote: '当前课标证据层没有这个学科路由。',
    };
  }

  if (grade === null) {
    return {
      scopeStatus: 'needs-context',
      standardId: null,
      routeSubject,
      subject: null,
      selectedModel: null,
      candidates: [],
      scopeNote: '需要年级才能确认是否适用 2022 义务教育课程标准。',
    };
  }

  if (grade > 9) {
    return {
      scopeStatus: 'out-of-scope',
      standardId: null,
      routeSubject,
      subject: null,
      selectedModel: null,
      candidates: [],
      scopeNote: '2022 模型只适用于义务教育；高中需要另行核对对应版本。',
    };
  }

  const standards = load(join(root, index.officialFacts));
  const subject = standards.subjects.find(item => item.subjectId === entry.subjectId);
  assert(subject, `${routeSubject}: curriculum subject facts missing`);
  if (grade < subject.gradeRange.min || grade > subject.gradeRange.max) {
    return {
      scopeStatus: 'out-of-scope',
      standardId: null,
      routeSubject,
      subject: null,
      selectedModel: null,
      candidates: [],
      scopeNote: `${subject.officialName} 当前模型适用 ${subject.gradeRange.min}–${subject.gradeRange.max} 年级。`,
    };
  }

  const profile = load(join(root, entry.file));
  assert(profile.routeSubject === routeSubject && profile.subjectId === subject.subjectId, `${routeSubject}: profile identity mismatch`);
  const officialById = new Map(subject.competencies.map(item => [item.competencyId, item]));
  const candidates = profile.models.map(model => ({
    modelId: model.modelId,
    competencyId: model.competencyId,
    officialName: officialById.get(model.competencyId)?.officialName ?? null,
    taskType: model.task.taskType,
    capabilityBindings: model.capabilityBindings,
  }));

  if (modelId === null && competencyId === null) {
    return {
      scopeStatus: 'needs-model-choice',
      standardId: index.standardId,
      routeSubject,
      subject: {
        subjectId: subject.subjectId,
        officialName: subject.officialName,
        gradeRange: subject.gradeRange,
        standardUrl: subject.standardUrl,
        sourceLocator: subject.sourceLocator,
      },
      selectedModel: null,
      candidates,
      scopeNote: '根据当前学生材料只选择一个最能解释可观察行为的模型。',
    };
  }

  const selected = profile.models.find(model => modelId ? model.modelId === modelId : model.competencyId === competencyId);
  assert(selected, `${routeSubject}: requested model does not belong to the current subject profile`);
  const officialCompetency = officialById.get(selected.competencyId);
  assert(officialCompetency, `${selected.modelId}: official competency facts missing`);
  const sourceEvidence = {
    standardUrl: subject.standardUrl,
    section: subject.sourceLocator.section,
    pdfPage: officialCompetency.sourcePage,
    sha256: subject.sourceLocator.sha256,
  };
  return {
    scopeStatus: 'applies',
    standardId: index.standardId,
    routeSubject,
    subject: {
      subjectId: subject.subjectId,
      officialName: subject.officialName,
      gradeRange: subject.gradeRange,
    },
    competency: officialCompetency,
    sourceEvidence,
    selectedModel: selected,
    candidates: [],
    constraints: {
      sessionOnly: profile.evidencePolicy.defaultState === 'session-only',
      singleObservationIsMastery: profile.evidencePolicy.singleObservationIsMastery,
      maxSelectedModels: profile.evidencePolicy.firstUseMaxModels,
      minimumIndependentObservations: profile.evidencePolicy.minimumIndependentObservations,
      transferRequired: profile.evidencePolicy.transferRequired,
    },
    scopeNote: '官方名称来自固定版本课标；观察、任务与反馈属于项目操作化。',
  };
}

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node skills/k12-learning/scripts/resolve-curriculum-evidence.mjs --route-subject <name> --grade <1-12> [--model-id <id> | --competency-id <id>]`);
  process.exit(message ? 2 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const input = { routeSubject: null, grade: null, modelId: null, competencyId: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--route-subject') input.routeSubject = args[++i] || usage('missing --route-subject value');
    else if (arg === '--grade') input.grade = Number(args[++i]);
    else if (arg === '--model-id') input.modelId = args[++i] || usage('missing --model-id value');
    else if (arg === '--competency-id') input.competencyId = args[++i] || usage('missing --competency-id value');
    else if (arg === '--help' || arg === '-h') usage();
    else usage(`unknown argument: ${arg}`);
  }
  if (!input.routeSubject || input.grade === null || !Number.isInteger(input.grade)) usage('--route-subject and integer --grade are required');
  console.log(JSON.stringify(resolveCurriculumEvidence(input), null, 2));
}
