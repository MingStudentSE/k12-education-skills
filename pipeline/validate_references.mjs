#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function walk(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, predicate));
    else if (predicate(path)) out.push(path);
  }
  return out;
}

function cleanReference(value) {
  return value.trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[，。；：,.;:]$/, '')
    .split('#')[0];
}

function extractReferences(text) {
  const found = new Set();
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  const referenceBlock = frontmatter?.[1].match(/^references:\s*\n((?:[ \t]+-[^\n]*\n?)*)/m)?.[1] || '';
  for (const match of referenceBlock.matchAll(/^[ \t]+-\s+(.+)$/gm)) found.add(cleanReference(match[1]));
  for (const match of text.matchAll(/`((?:\.{1,2}\/|references\/|schemas\/|scripts\/|assets\/)[^`\n]+)`/g)) found.add(cleanReference(match[1]));
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const value = cleanReference(match[1]);
    if (!/^(?:https?:|mailto:|#)/.test(value)) found.add(value);
  }
  return [...found].filter(value => value && !value.includes('*') && !/[{}<>]/.test(value));
}

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

function directFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
    .map(entry => join(dir, entry.name));
}

function ownedFiles(owner) {
  const base = dirname(owner);
  if (basename(owner) === 'SKILL.md') return directFiles(join(base, 'references'));
  return [
    ...walk(join(base, 'references'), path => !basename(path).startsWith('.')),
    ...walk(join(base, 'schemas'), path => !basename(path).startsWith('.')),
  ];
}

function visitRefs(value, callback) {
  if (Array.isArray(value)) for (const item of value) visitRefs(item, callback);
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === '$ref' && typeof item === 'string') callback(item);
      else visitRefs(item, callback);
    }
  }
}

export function validateRepository(root) {
  const skills = join(root, 'skills');
  const errors = [];
  if (!existsSync(skills)) return [{ type: 'missing-skills-root', file: relative(root, skills), detail: 'skills directory does not exist' }];
  const moduleDirs = readdirSync(skills, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(skills, entry.name, 'SKILL.md')))
    .map(entry => join(skills, entry.name));

  for (const file of walk(skills, path => /^SKILL\..+\.md$/.test(basename(path)))) {
    errors.push({ type: 'alternative-skill-interface', file: relative(root, file), detail: 'only canonical SKILL.md interfaces are allowed' });
  }

  for (const moduleDir of moduleDirs) {
    const owners = [join(moduleDir, 'SKILL.md'), ...walk(moduleDir, path => basename(path) === 'playbook.md')];
    for (const owner of owners) {
      const text = readFileSync(owner, 'utf8');
      const referenced = new Set();
      for (const value of extractReferences(text)) {
        const path = resolve(dirname(owner), value);
        if (!isInside(moduleDir, path)) {
          errors.push({ type: 'module-path-escape', file: relative(root, owner), detail: value });
          continue;
        }
        if (!existsSync(path)) {
          errors.push({ type: 'dangling-reference', file: relative(root, owner), detail: value });
          continue;
        }
        referenced.add(path);
      }
      for (const path of ownedFiles(owner)) {
        if (!referenced.has(path)) errors.push({ type: 'orphan-resource', file: relative(root, path), detail: `not declared by ${relative(root, owner)}` });
      }
    }
  }

  for (const file of walk(skills, path => basename(path).endsWith('.schema.json'))) {
    let schema;
    try { schema = JSON.parse(readFileSync(file, 'utf8')); }
    catch (error) {
      errors.push({ type: 'invalid-schema-json', file: relative(root, file), detail: error.message });
      continue;
    }
    visitRefs(schema, value => {
      if (value.startsWith('#') || /^https?:/.test(value)) return;
      const target = resolve(dirname(file), value.split('#')[0]);
      const moduleDir = moduleDirs.find(dir => isInside(dir, file));
      if (!moduleDir || !isInside(moduleDir, target)) errors.push({ type: 'schema-path-escape', file: relative(root, file), detail: value });
      else if (!existsSync(target)) errors.push({ type: 'dangling-schema-ref', file: relative(root, file), detail: value });
    });
  }
  return errors;
}

function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const errors = validateRepository(root);
  if (errors.length) {
    console.error(`reference integrity: ${errors.length} violation(s)`);
    for (const error of errors) console.error(`- [${error.type}] ${error.file}: ${error.detail}`);
    process.exit(1);
  }
  const ownerCount = walk(join(root, 'skills'), path => basename(path) === 'SKILL.md' || basename(path) === 'playbook.md').length;
  console.log(`reference integrity: ${ownerCount} owners; no dangling, escaped, orphan, or alternative interfaces`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
