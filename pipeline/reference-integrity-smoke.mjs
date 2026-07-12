#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { validateRepository } from './validate_references.mjs';

const assert = (condition, message) => { if (!condition) throw new Error(message); };

function write(root, path, text = '') {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function fixture(configure) {
  const root = mkdtempSync(join(tmpdir(), 'k12-reference-fixture-'));
  write(root, 'skills/demo/SKILL.md', '---\nname: demo\ndescription: demo fixture with enough text for validation\nreferences:\n  - references/module.md\n---\n');
  write(root, 'skills/demo/references/module.md', '# module');
  write(root, 'skills/demo/references/playbooks/demo/demo/playbook.md', '---\nname: demo-playbook\nreferences:\n  - references/detail.md\n  - schemas/nested/detail.schema.json\n---\n`references/detail.md` `schemas/nested/detail.schema.json`\n');
  write(root, 'skills/demo/references/playbooks/demo/demo/references/detail.md', '# detail');
  write(root, 'skills/demo/references/playbooks/demo/demo/schemas/nested/detail.schema.json', '{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object"}');
  configure?.(root);
  return root;
}

const cases = [
  ['valid-nested-schema', null, errors => errors.length === 0],
  ['dangling', root => write(root, 'skills/demo/SKILL.md', '---\nname: demo\ndescription: demo fixture with enough text for validation\nreferences:\n  - references/missing.md\n---\n'), errors => errors.some(error => error.type === 'dangling-reference')],
  ['orphan', root => write(root, 'skills/demo/references/playbooks/demo/demo/references/orphan.md', '# orphan'), errors => errors.some(error => error.type === 'orphan-resource' && error.file.endsWith('orphan.md'))],
  ['path-escape', root => write(root, 'skills/demo/SKILL.md', '---\nname: demo\ndescription: demo fixture with enough text for validation\n---\n`../../outside.md`\n'), errors => errors.some(error => error.type === 'module-path-escape')],
  ['alternative-interface', root => write(root, 'skills/demo/SKILL.lite.md', '# duplicate interface'), errors => errors.some(error => error.type === 'alternative-skill-interface')],
];

let passed = 0;
for (const [name, configure, expected] of cases) {
  const root = fixture(configure);
  try {
    const errors = validateRepository(root);
    assert(expected(errors), `${name}: unexpected errors ${JSON.stringify(errors)}`);
    passed += 1;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(`reference integrity smoke: ${passed}/${cases.length} fixtures passed`);
