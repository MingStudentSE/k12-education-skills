#!/usr/bin/env node
// One-shot compatibility path. Steady-state runtime never imports this file and
// never reads profile.md. Remove this script after --audit reports exit_ready=true
// for every supported data root through one release cycle.
import {
  closeSync,
  existsSync,
  openSync,
  readSync,
  readdirSync,
  statSync,
} from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  automationStatePath,
  hasLocalAuthorization,
  readStudentAuthorization,
  writeStudentAuthorization,
} from './authorization.mjs';

const ROOT = process.env.K12_ROOT || process.cwd();
const STUDENTS = process.env.K12_STUDENTS_DIR || join(ROOT, 'students');
const STUDENT_ID = /^(?!_)[A-Za-z0-9_-]{1,80}$/;

function readFrontmatterPrefix(filePath, maxBytes = 8192) {
  const fd = openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes);
    const count = readSync(fd, buffer, 0, maxBytes, 0);
    const text = buffer.subarray(0, count).toString('utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!match) throw new Error('旧 profile.md 缺少完整 frontmatter');
    const meta = {};
    for (const line of match[1].split('\n')) {
      const index = line.indexOf(':');
      if (index > 0) meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
    return meta;
  } finally { closeSync(fd); }
}

function studentDirectories() {
  if (!existsSync(STUDENTS)) return [];
  return readdirSync(STUDENTS)
    .filter(id => STUDENT_ID.test(id))
    .map(id => ({ id, dir: join(STUDENTS, id) }))
    .filter(item => statSync(item.dir).isDirectory());
}

export function auditLegacyAuthorization() {
  const candidates = [];
  const noConsentProfiles = [];
  const invalidStates = [];
  for (const item of studentDirectories()) {
    if (existsSync(automationStatePath(item.dir))) {
      try { readStudentAuthorization(item.dir); }
      catch (error) { invalidStates.push({ id: item.id, error: error.message }); }
      continue;
    }
    const profilePath = join(item.dir, 'profile.md');
    if (!existsSync(profilePath)) continue;
    let legacy;
    try { legacy = readFrontmatterPrefix(profilePath); }
    catch (error) {
      noConsentProfiles.push({ id: item.id, reason: error.message });
      continue;
    }
    if (hasLocalAuthorization(legacy)) candidates.push(item);
    else noConsentProfiles.push({ id: item.id, reason: '没有完整有效的旧 Automation 本地授权' });
  }
  return {
    legacy_candidates: candidates.map(item => item.id),
    count: candidates.length,
    learning_profiles_without_legacy_authorization: noConsentProfiles,
    invalid_automation_states: invalidStates,
    exit_ready: candidates.length === 0 && invalidStates.length === 0,
    exit_criterion: 'all supported data roots report exit_ready=true for one release cycle',
  };
}

export function migrateLegacyAuthorization(studentId) {
  if (!STUDENT_ID.test(studentId)) throw new Error('学生 ID 非法');
  const studentDir = join(STUDENTS, studentId);
  if (!existsSync(studentDir) || !statSync(studentDir).isDirectory()) throw new Error(`学生目录不存在：${studentId}`);
  if (existsSync(automationStatePath(studentDir))) {
    throw new Error('Automation state 已存在；该对象已经退出 legacy compatibility path');
  }
  const profilePath = join(studentDir, 'profile.md');
  if (!existsSync(profilePath)) throw new Error('没有可迁移的旧 profile.md');
  const legacy = readFrontmatterPrefix(profilePath);
  if (!hasLocalAuthorization(legacy)) throw new Error('旧 profile.md 没有完整有效的本地运行授权，不能迁移');
  const state = writeStudentAuthorization(studentDir, studentId, {
    authorized: true,
    authorized_by: legacy.authorized_by,
    authorization_subject: legacy.authorization_subject,
    authorization_date: legacy.authorization_date,
    authorization_method: legacy.authorization_method,
    authorization_action: 'create',
    // External processing always requires a fresh Automation-owned consent.
    external_processing_authorized: false,
    external_processing_provider: '',
    external_processing_scope: '',
    external_processing_authorization_date: '',
  }, 'create');
  return state;
}

function main(argv) {
  if (argv.length === 1 && argv[0] === '--audit') {
    console.log(JSON.stringify(auditLegacyAuthorization(), null, 2));
    return;
  }
  if (argv.length === 3 && argv[0] === '--student' && argv[2] === '--confirm') {
    migrateLegacyAuthorization(argv[1]);
    console.log(`${argv[1]} 已写入 automation/state.json；steady-state runtime 将忽略旧 profile.md。外部处理需重新授权。`);
    return;
  }
  throw new Error('用法：migrate-legacy-authorization.mjs --audit | --student <student-id> --confirm');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    console.error(`FATAL: ${error.message}`);
    process.exitCode = 1;
  }
}
