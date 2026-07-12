#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-source-verifier-smoke-'));
const pdfDir = join(tempRoot, 'pdfs');
const standardsPath = join(tempRoot, 'standards.json');
const fakePdftotext = join(tempRoot, 'fake-pdftotext.mjs');
const pdfBytes = Buffer.from('%PDF-1.4\n% deterministic source verifier smoke\n');
const hash = createHash('sha256').update(pdfBytes).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const standards = {
  dataVersion: '1.2.0',
  standard: {
    noticeUrl: 'https://www.moe.gov.cn/example/notice.html',
  },
  subjects: [{
    subjectId: 'history',
    officialName: '历史',
    standardUrl: 'https://www.moe.gov.cn/example/history.pdf',
    sourceLocator: {
      section: '三、课程目标 / （一）核心素养内涵',
      pdfPage: 11,
      sha256: hash,
    },
    competencies: [{ competencyId: 'history.source-evidence', officialName: '史料实证', sourcePage: 11 }],
  }],
};

function run(extraEnv = {}) {
  return spawnSync(process.execPath, [
    join(ROOT, 'pipeline/verify_curriculum_sources.mjs'),
    '--pdf-dir', pdfDir,
    '--subject', 'history',
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      K12_CURRICULUM_STANDARDS: standardsPath,
      PDFTOTEXT_BIN: fakePdftotext,
      ...extraEnv,
    },
    encoding: 'utf8',
    timeout: 30_000,
  });
}

try {
  await import('node:fs/promises').then(({ mkdir }) => mkdir(pdfDir));
  writeFileSync(join(pdfDir, 'history.pdf'), pdfBytes);
  writeFileSync(fakePdftotext, `#!/usr/bin/env node\nprocess.stdout.write('三、课程目标\\n（一）核心素养内涵\\n历史课程\\n史料实证\\n');\n`);
  chmodSync(fakePdftotext, 0o755);
  writeFileSync(standardsPath, `${JSON.stringify(standards, null, 2)}\n`);

  const good = run();
  assert(good.status === 0, `source verifier positive smoke failed: ${good.stderr || good.stdout}`);
  for (const marker of ['download hash', 'pinned section markers 2/2', 'official subject/competency labels 2/2']) {
    assert(good.stdout.includes(marker), `source verifier omitted evidence class: ${marker}`);
  }

  standards.subjects[0].competencies[0].officialName = '不存在的素养';
  writeFileSync(standardsPath, `${JSON.stringify(standards, null, 2)}\n`);
  const badLabel = run();
  assert(badLabel.status === 1 && badLabel.stderr.includes('does not contain official label'), 'source verifier accepted a label absent from its exact competency sourcePage');

  const missingExtractor = run({ PDFTOTEXT_BIN: join(tempRoot, 'missing-pdftotext'), PDFTOPPM_BIN: join(tempRoot, 'missing-pdftoppm') });
  assert(missingExtractor.status === 1 && missingExtractor.stderr.includes('required executable'), 'source verifier did not fail closed when extraction tools were unavailable');

  console.log('curriculum source verifier smoke: download hash + pinned section + official labels validated; wrong labels and missing extractors fail closed');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
