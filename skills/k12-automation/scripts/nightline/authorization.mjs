export const AUTH_SUBJECTS = new Set(['student', 'guardian']);
export const AUTH_METHODS = new Set(['written', 'verbal', 'digital']);
export const EXTERNAL_PROCESSING_SCOPE = 'profile-summary,current-mistake,recent-3-archives';

function validPastOrTodayDate(value) {
  const text = String(value || '');
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) return false;
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return text <= localToday;
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
  return meta?.authorized === 'true'
    && AUTH_SUBJECTS.has(String(meta.authorization_subject || ''))
    && AUTH_METHODS.has(String(meta.authorization_method || ''))
    && validPastOrTodayDate(meta.authorization_date)
    && Boolean(String(meta.authorized_by || '').trim());
}

export function hasExternalProcessingAuthorization(meta, configuredProvider) {
  const provider = normalizeProvider(configuredProvider);
  return hasLocalAuthorization(meta)
    && meta?.external_processing_authorized === 'true'
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
import { closeSync, openSync, readSync } from 'fs';
