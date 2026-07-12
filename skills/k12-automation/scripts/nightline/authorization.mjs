import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join } from 'path';

export const AUTH_SUBJECTS = new Set(['student', 'guardian']);
export const AUTH_METHODS = new Set(['written', 'verbal', 'digital']);
export const EXTERNAL_PROCESSING_SCOPE = 'current-mistake,recent-3-archives';
export const AUTOMATION_STATE_SCHEMA = 'k12-automation-state/v1';
export const AUTOMATION_STATE_RELATIVE_PATH = 'automation/state.json';

function validPastOrTodayDate(value) {
  const text = String(value || '');
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) return false;
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return text <= localToday;
}

function trueFlag(value) {
  return value === true || value === 'true';
}

export function normalizeProvider(value) {
  try { return new URL(String(value || '')).origin; }
  catch { return ''; }
}

export function readFrontmatterPrefix(filePath, maxBytes = 8192) {
  const fd = openSync(filePath, 'r');
  try {
    const byte = Buffer.alloc(1);
    const bytesRead = [];
    for (let position = 0; position < maxBytes; position++) {
      const bytes = readSync(fd, byte, 0, 1, position);
      if (!bytes) break;
      bytesRead.push(byte[0]);
      const n = bytesRead.length;
      if (n >= 5 && bytesRead.slice(n - 5).join(',') === '10,45,45,45,10') break;
    }
    const text = Buffer.from(bytesRead).toString('utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    const meta = {};
    if (match) for (const line of match[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    return meta;
  } finally { closeSync(fd); }
}

export function hasLocalAuthorization(meta) {
  return trueFlag(meta?.authorized)
    && AUTH_SUBJECTS.has(String(meta.authorization_subject || ''))
    && AUTH_METHODS.has(String(meta.authorization_method || ''))
    && validPastOrTodayDate(meta.authorization_date)
    && Boolean(String(meta.authorized_by || '').trim());
}

export function hasExternalProcessingAuthorization(meta, configuredProvider) {
  const provider = normalizeProvider(configuredProvider);
  return hasLocalAuthorization(meta)
    && trueFlag(meta?.external_processing_authorized)
    && validPastOrTodayDate(meta.external_processing_authorization_date)
    && meta.external_processing_scope === EXTERNAL_PROCESSING_SCOPE
    && Boolean(provider)
    && normalizeProvider(meta.external_processing_provider) === provider;
}

export function validateAuthorizationInput({ subject, date, method }) {
  if (!AUTH_SUBJECTS.has(String(subject || ''))) return '授权主体只能是学生本人或监护人';
  if (!validPastOrTodayDate(date)) return '授权日期必须是今天或更早的有效日期';
  if (!AUTH_METHODS.has(String(method || ''))) return '授权方式只能是书面、口头或电子确认';
  return '';
}

export function authorizationSummary({ subject, date, method }) {
  const subjectLabel = subject === 'student' ? '学生本人' : '监护人';
  const methodLabel = { written: '书面同意', verbal: '口头同意', digital: '电子确认' }[method];
  return `${subjectLabel}，${date}，${methodLabel}`;
}

export function automationStatePath(studentDir) {
  return join(studentDir, 'automation', 'state.json');
}

function authorizationFromState(state) {
  const local = state.authorization?.local || {};
  const external = state.authorization?.external_processing || {};
  return {
    authorized: local.authorized,
    authorized_by: local.authorized_by,
    authorization_subject: local.subject,
    authorization_date: local.date,
    authorization_method: local.method,
    authorization_action: local.action,
    external_processing_authorized: external.authorized,
    external_processing_provider: external.provider,
    external_processing_scope: external.scope,
    external_processing_authorization_date: external.date,
  };
}

function parseAutomationState(filePath) {
  let state;
  try { state = JSON.parse(readFileSync(filePath, 'utf8')); }
  catch (error) { throw new Error(`Automation 授权状态不是有效 JSON：${error.message}`); }
  if (!state || state.schema_version !== AUTOMATION_STATE_SCHEMA || !/^[A-Za-z0-9_-]{1,80}$/.test(String(state.student_id || ''))) {
    throw new Error(`Automation 授权状态契约不受支持：必须是 ${AUTOMATION_STATE_SCHEMA}`);
  }
  if (!state.authorization || !state.authorization.local || !state.authorization.external_processing) {
    throw new Error('Automation 授权状态缺少 authorization.local/external_processing');
  }
  const local = state.authorization.local;
  const external = state.authorization.external_processing;
  if (typeof local.authorized !== 'boolean' || typeof external.authorized !== 'boolean') {
    throw new Error('Automation 授权状态的 authorized 必须是 boolean');
  }
  for (const [label, value] of [
    ['local.authorized_by', local.authorized_by],
    ['local.subject', local.subject],
    ['local.date', local.date],
    ['local.method', local.method],
    ['local.action', local.action],
    ['external_processing.provider', external.provider],
    ['external_processing.scope', external.scope],
    ['external_processing.date', external.date],
  ]) {
    if (typeof value !== 'string') throw new Error(`Automation 授权状态的 ${label} 必须是 string`);
  }
  return state;
}

/**
 * Read Automation-owned authorization first. A legacy profile.md is a read-only
 * compatibility source and is never used when an Automation state file exists.
 */
export function readStudentAuthorization(studentDir) {
  const statePath = automationStatePath(studentDir);
  if (existsSync(statePath)) {
    const state = parseAutomationState(statePath);
    if (state.student_id !== basename(studentDir)) {
      throw new Error('Automation 授权状态的 student_id 与目录不一致');
    }
    return { source: 'automation-state', record: authorizationFromState(state), state };
  }
  const legacyProfile = join(studentDir, 'profile.md');
  if (existsSync(legacyProfile)) {
    return { source: 'legacy-profile', record: readFrontmatterPrefix(legacyProfile), state: null };
  }
  return { source: 'none', record: {}, state: null };
}

/**
 * Persist only Automation runtime/authorization state. Learning-owned
 * profile.md remains untouched, including for legacy students.
 */
export function writeStudentAuthorization(studentDir, studentId, record, action, timestamp = new Date().toISOString()) {
  const filePath = automationStatePath(studentDir);
  let existing = null;
  if (existsSync(filePath)) existing = parseAutomationState(filePath);
  const state = {
    schema_version: AUTOMATION_STATE_SCHEMA,
    student_id: studentId,
    authorization: {
      local: {
        authorized: trueFlag(record.authorized),
        authorized_by: String(record.authorized_by || ''),
        subject: String(record.authorization_subject || ''),
        date: String(record.authorization_date || ''),
        method: String(record.authorization_method || ''),
        action: String(record.authorization_action || action || ''),
      },
      external_processing: {
        authorized: trueFlag(record.external_processing_authorized),
        provider: String(record.external_processing_provider || ''),
        scope: String(record.external_processing_scope || ''),
        date: String(record.external_processing_authorization_date || ''),
      },
    },
    runtime: {
      created_at: existing?.runtime?.created_at || timestamp,
      updated_at: timestamp,
      last_action: String(action || 'update'),
    },
  };
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tempPath, filePath);
  return state;
}
