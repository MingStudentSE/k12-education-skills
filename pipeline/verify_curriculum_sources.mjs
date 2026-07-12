#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STANDARDS = process.env.K12_CURRICULUM_STANDARDS || join(ROOT, 'skills/k12-learning/references/curriculum/2022/standards.json');
const OCR_SCRIPT = join(ROOT, 'pipeline/ocr-image-text.swift');
const PDFTOTEXT = process.env.PDFTOTEXT_BIN || 'pdftotext';
const PDFTOPPM = process.env.PDFTOPPM_BIN || 'pdftoppm';
const SWIFT = process.env.SWIFT_BIN || 'swift';
const TESSERACT = process.env.TESSERACT_BIN || 'tesseract';

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node pipeline/verify_curriculum_sources.mjs --contract-only
  node pipeline/verify_curriculum_sources.mjs --pdf-dir <directory> [--subject <id> ...]
  node pipeline/verify_curriculum_sources.mjs --live [--subject <id> ...]`);
  process.exit(message ? 2 : 0);
}

const options = { contractOnly: false, live: false, pdfDir: null, subjects: [] };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--contract-only') options.contractOnly = true;
  else if (arg === '--live') options.live = true;
  else if (arg === '--pdf-dir') options.pdfDir = args[++i] || usage('missing --pdf-dir value');
  else if (arg === '--subject') options.subjects.push(args[++i] || usage('missing --subject value'));
  else if (arg === '--help' || arg === '-h') usage();
  else usage(`unknown argument: ${arg}`);
}
if ([options.contractOnly, options.live, Boolean(options.pdfDir)].filter(Boolean).length !== 1) {
  usage('choose exactly one verification mode');
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const normalizeEvidenceText = value => value
  .normalize('NFKC')
  .replace(/[\s，。；：、·•（）()《》〈〉“”‘’"'—–-]/g, '');
const standards = JSON.parse(readFileSync(STANDARDS, 'utf8'));
const requested = new Set(options.subjects);
for (const subject of requested) assert(standards.subjects.some(item => item.subjectId === subject), `unknown subject: ${subject}`);
const selected = standards.subjects.filter(subject => requested.size === 0 || requested.has(subject.subjectId));

assert(standards.dataVersion === '1.2.0', 'curriculum source evidence requires competency-locator dataVersion 1.2.0');
assert(/^https:\/\/(?:www|hudong)\.moe\.gov\.cn\//.test(standards.standard.noticeUrl), 'notice must be an official MOE URL');
for (const subject of selected) {
  const locator = subject.sourceLocator;
  assert(/^https:\/\/(?:www|hudong)\.moe\.gov\.cn\/.*\.pdf$/.test(subject.standardUrl), `${subject.subjectId}: source must be an official MOE PDF`);
  assert(locator && /^三、课程目标 \/ （一）核心素养内涵/.test(locator.section), `${subject.subjectId}: exact section locator missing`);
  assert(Number.isInteger(locator.pdfPage) && locator.pdfPage > 0, `${subject.subjectId}: PDF page locator missing`);
  assert(/^[a-f0-9]{64}$/.test(locator.sha256), `${subject.subjectId}: PDF sha256 missing`);
  for (const competency of subject.competencies) {
    assert(Number.isInteger(competency.sourcePage) && competency.sourcePage >= locator.pdfPage, `${competency.competencyId}: exact competency sourcePage missing or precedes section start`);
  }
}
assert(new Set(selected.map(subject => subject.standardUrl)).size === selected.length, 'supported subjects must use distinct official PDFs');

if (options.contractOnly) {
  const competencyCount = selected.reduce((total, subject) => total + subject.competencies.length, 0);
  console.log(`curriculum sources contract: ${selected.length} official PDFs have URL + section-start + sha256; ${competencyCount} competencies have exact sourcePage locators`);
  process.exit(0);
}

async function fetchWithRetry(url, timeoutMs, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
      assert(response.ok, `${url}: HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.log(`  [RETRY] ${url} attempt ${attempt}/${attempts} failed (${error.message}); backing off`);
        await new Promise(resolve => setTimeout(resolve, attempt * 15_000));
      }
    }
  }
  throw lastError;
}

async function fetchBytes(url) {
  const response = await fetchWithRetry(url, 120_000);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.subarray(0, 5).toString() === '%PDF-', `${url}: response is not a PDF`);
  return bytes;
}

function runTool(command, args, label, { allowMissing = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 180_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error?.code === 'ENOENT' && allowMissing) return null;
  assert(!result.error, `${label}: required executable '${command}' is unavailable (${result.error?.message}). Install Poppler plus an OCR backend, or set the corresponding *_BIN environment variable.`);
  assert(result.status === 0, `${label}: ${command} exited ${result.status}: ${(result.stderr || result.stdout || '').slice(-1200)}`);
  return result.stdout || '';
}

function extractPinnedPage(pdfPath, pdfPage, workDir, subjectId) {
  const embedded = runTool(PDFTOTEXT, ['-f', String(pdfPage), '-l', String(pdfPage), '-layout', pdfPath, '-'], `${subjectId}: embedded page text`, { allowMissing: true });
  if (embedded && normalizeEvidenceText(embedded).length >= 20) {
    return { text: embedded, extractor: 'pdftotext' };
  }

  const imagePrefix = join(workDir, `${subjectId}-page-${pdfPage}`);
  runTool(PDFTOPPM, ['-f', String(pdfPage), '-l', String(pdfPage), '-r', '220', '-png', '-singlefile', pdfPath, imagePrefix], `${subjectId}: render pinned PDF page`);
  const imagePath = `${imagePrefix}.png`;
  assert(existsSync(imagePath), `${subjectId}: pdftoppm did not render pinned page ${pdfPage}`);

  if (process.platform === 'darwin') {
    assert(existsSync(OCR_SCRIPT), `${subjectId}: missing macOS Vision OCR script ${OCR_SCRIPT}`);
    const text = runTool(SWIFT, [OCR_SCRIPT, imagePath], `${subjectId}: macOS Vision OCR`);
    assert(normalizeEvidenceText(text).length >= 20, `${subjectId}: OCR returned no usable text for pinned page ${pdfPage}`);
    return { text, extractor: 'macOS Vision OCR' };
  }

  const text = runTool(TESSERACT, [imagePath, 'stdout', '-l', 'chi_sim+eng'], `${subjectId}: Tesseract OCR`);
  assert(normalizeEvidenceText(text).length >= 20, `${subjectId}: OCR returned no usable text for pinned page ${pdfPage}`);
  return { text, extractor: 'Tesseract chi_sim+eng' };
}

function verifyPinnedSection(subject, extracted) {
  const normalized = normalizeEvidenceText(extracted.text);
  const sectionParts = subject.sourceLocator.section.split('/').map(part => part.trim()).filter(Boolean);
  for (const part of sectionParts) {
    assert(normalized.includes(normalizeEvidenceText(part)), `${subject.subjectId}: pinned page ${subject.sourceLocator.pdfPage} does not contain section marker '${part}'`);
  }
  assert(normalized.includes(normalizeEvidenceText(subject.officialName)), `${subject.subjectId}: pinned page ${subject.sourceLocator.pdfPage} does not identify official subject '${subject.officialName}'`);
  return sectionParts.length;
}

function verifyOfficialLabels(subject, pdfPath, workDir, firstExtracted) {
  const pageText = new Map([[subject.sourceLocator.pdfPage, firstExtracted]]);
  for (const competency of subject.competencies) {
    if (!pageText.has(competency.sourcePage)) {
      pageText.set(competency.sourcePage, extractPinnedPage(pdfPath, competency.sourcePage, workDir, subject.subjectId));
    }
    const normalized = normalizeEvidenceText(pageText.get(competency.sourcePage).text);
    assert(normalized.includes(normalizeEvidenceText(competency.officialName)), `${competency.competencyId}: pinned sourcePage ${competency.sourcePage} does not contain official label '${competency.officialName}'`);
  }
  return {
    officialLabels: subject.competencies.length + 1,
    pages: [...pageText.keys()].sort((a, b) => a - b),
  };
}

if (options.live) {
  const notice = await fetchWithRetry(standards.standard.noticeUrl, 60_000);
  const body = await notice.text();
  assert(body.includes('义务教育课程方案和课程标准') && body.includes('2022年秋季学期开始执行'), 'official notice no longer contains the pinned title/effective statement');
  console.log('  [PASS] official notice · title and 2022 autumn effective statement');
}

let passed = 0;
const workDir = mkdtempSync(join(tmpdir(), 'k12-curriculum-source-'));
try {
  for (const subject of selected) {
    const cachedPath = options.pdfDir ? join(options.pdfDir, `${subject.subjectId}.pdf`) : null;
    if (cachedPath) assert(existsSync(cachedPath), `${subject.subjectId}: cached PDF missing`);
    const bytes = options.live ? await fetchBytes(subject.standardUrl) : readFileSync(cachedPath);
    assert(bytes.subarray(0, 5).toString() === '%PDF-', `${subject.subjectId}: source bytes are not a PDF`);
    const actualHash = sha256(bytes);
    assert(actualHash === subject.sourceLocator.sha256, `${subject.subjectId}: official PDF drifted from pinned sha256`);
    console.log(`  [PASS] ${subject.subjectId} · download hash · sha256=${actualHash}`);

    const pdfPath = cachedPath || join(workDir, `${subject.subjectId}.pdf`);
    if (!cachedPath) writeFileSync(pdfPath, bytes);
    const extracted = extractPinnedPage(pdfPath, subject.sourceLocator.pdfPage, workDir, subject.subjectId);
    console.log(`  [PASS] ${subject.subjectId} · pinned page ${subject.sourceLocator.pdfPage} extracted via ${extracted.extractor}`);
    const sectionParts = verifyPinnedSection(subject, extracted);
    console.log(`  [PASS] ${subject.subjectId} · pinned section markers ${sectionParts}/${sectionParts}`);
    const labels = verifyOfficialLabels(subject, pdfPath, workDir, extracted);
    console.log(`  [PASS] ${subject.subjectId} · official subject/competency labels ${labels.officialLabels}/${labels.officialLabels} · evidence pages ${labels.pages.join(',')}`);
    passed += 1;
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
console.log(`curriculum sources ${options.live ? 'live' : 'cached'} verification: ${passed}/${selected.length} download hashes + pinned sections + official labels verified`);
