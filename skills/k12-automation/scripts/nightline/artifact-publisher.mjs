import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { basename, extname, join } from 'path';

const DEFAULT_OPERATIONS = {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
};

const OUTPUT_LABELS = ['错因诊断', '变式训练题', '答案与讲解'];

function uniqueName(base, occupied) {
  let candidate = base;
  let index = 2;
  while (occupied(candidate)) candidate = `${base}-${index++}`;
  return candidate;
}

export function planNightItemSlugs(files) {
  const sorted = [...files].sort();
  const parts = sorted.map(file => {
    const extension = extname(file).toLowerCase();
    return {
      file,
      extension: extension.slice(1),
      stem: basename(file, extension),
    };
  });
  const counts = new Map();
  for (const item of parts) counts.set(item.stem, (counts.get(item.stem) || 0) + 1);
  const used = new Set();
  return parts.map(item => {
    const preferred = counts.get(item.stem) > 1 ? `${item.stem}-${item.extension}` : item.stem;
    const slug = uniqueName(preferred, candidate => used.has(candidate));
    used.add(slug);
    return { file: item.file, slug };
  });
}

function availableOutputSlug(ops, outDir, preferred) {
  return uniqueName(preferred, slug => OUTPUT_LABELS.some(label => ops.existsSync(join(outDir, `${slug}-${label}.md`))));
}

function availablePath(ops, preferred) {
  const extension = extname(preferred);
  const stem = preferred.slice(0, -extension.length);
  return uniqueName(stem, candidate => ops.existsSync(`${candidate}${extension}`)) + extension;
}

function cleanupPublished(ops, paths) {
  for (const path of [...paths].reverse()) {
    try { if (ops.existsSync(path)) ops.unlinkSync(path); }
    catch { /* 保留原始发布错误；残留路径只会让后续发布选择新后缀，不会被覆盖 */ }
  }
}

/**
 * Stage a complete item first, publish with no-clobber hard links, and only then
 * move the inbox source. operationOverrides exists solely for deterministic
 * failure injection in runtime smoke tests.
 */
export function publishNightAnalysisArtifacts({
  studentDir,
  itemPath,
  businessDate,
  preferredSlug,
  diagnosis,
  problems,
  solutions,
  archive,
}, operationOverrides = {}) {
  const ops = { ...DEFAULT_OPERATIONS, ...operationOverrides };
  const outRoot = join(studentDir, 'outbox');
  const outDir = join(outRoot, businessDate);
  const archiveDir = join(studentDir, 'archive');
  const processedDir = join(studentDir, 'inbox', 'processed');
  const stagingRoot = join(studentDir, 'automation', 'staging');
  let stagingDir = '';
  const published = [];

  try {
    for (const directory of [outDir, archiveDir, processedDir, stagingRoot]) {
      ops.mkdirSync(directory, { recursive: true });
    }
    stagingDir = ops.mkdtempSync(join(stagingRoot, '.night-item-'));
    const staged = [
      ['diagnosis.md', `${diagnosis}\n`],
      ['problems.md', `${problems}\n`],
      ['solutions.md', `${solutions}\n`],
      ['archive.md', `${archive}\n`],
    ];
    for (const [name, content] of staged) ops.writeFileSync(join(stagingDir, name), content, { flag: 'wx' });

    const slug = availableOutputSlug(ops, outDir, preferredSlug);
    const archivePrefix = `错题-${businessDate.replace(/-/g, '')}`;
    let sequence = 1;
    while (ops.existsSync(join(archiveDir, `${archivePrefix}-${String(sequence).padStart(3, '0')}.md`))) sequence += 1;
    const archivePath = join(archiveDir, `${archivePrefix}-${String(sequence).padStart(3, '0')}.md`);
    const processedPath = availablePath(ops, join(processedDir, `${businessDate}_${basename(itemPath)}`));
    const targets = [
      [join(stagingDir, 'diagnosis.md'), join(outDir, `${slug}-错因诊断.md`)],
      [join(stagingDir, 'problems.md'), join(outDir, `${slug}-变式训练题.md`)],
      [join(stagingDir, 'solutions.md'), join(outDir, `${slug}-答案与讲解.md`)],
      [join(stagingDir, 'archive.md'), archivePath],
    ];
    for (const [source, target] of targets) {
      ops.linkSync(source, target);
      published.push(target);
    }

    ops.renameSync(itemPath, processedPath);
    try { ops.rmSync(stagingDir, { recursive: true, force: true }); }
    catch { /* 已提交的产物优先；残留 staging 不参与读取，可由维护者清理 */ }
    return { slug, archivePath, processedPath, outputPaths: targets.slice(0, 3).map(([, target]) => target) };
  } catch (error) {
    cleanupPublished(ops, published);
    if (stagingDir) {
      try { ops.rmSync(stagingDir, { recursive: true, force: true }); }
      catch { /* 不覆盖原始错误 */ }
    }
    throw error;
  }
}
