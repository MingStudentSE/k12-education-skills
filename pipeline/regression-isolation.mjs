import {
  accessSync,
  constants,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, delimiter, isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveExecutable(command) {
  const candidates = isAbsolute(command) || command.includes('/')
    ? [command]
    : (process.env.PATH || '').split(delimiter).filter(Boolean).map(dir => join(dir, command));
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next PATH entry.
    }
  }
  return null;
}

function seatbeltLiteral(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function prepareFixturelessSut(sourceRoot, moduleNames, schemaPaths = []) {
  const workspaceRoot = mkdtempSync(join(tmpdir(), 'k12-regression-sut-'));
  mkdirSync(join(workspaceRoot, 'skills'), { recursive: true });
  mkdirSync(join(workspaceRoot, 'pipeline'), { recursive: true });
  for (const moduleName of new Set(moduleNames)) {
    cpSync(join(sourceRoot, 'skills', moduleName), join(workspaceRoot, 'skills', moduleName), {
      recursive: true,
      filter: source => basename(source) !== 'test-prompts.json',
    });
    assert(!existsSync(join(workspaceRoot, 'skills', moduleName, 'test-prompts.json')), `${moduleName}: isolated SUT leaked test-prompts.json`);
  }
  const schemas = new Map();
  for (const schemaPath of schemaPaths) {
    const target = join(workspaceRoot, 'pipeline', basename(schemaPath));
    cpSync(schemaPath, target);
    schemas.set(schemaPath, target);
  }
  return {
    workspaceRoot,
    schemaPath: original => schemas.get(original),
    cleanup: () => rmSync(workspaceRoot, { recursive: true, force: true }),
  };
}

export function spawnWithSourceReadDenied(command, args, {
  sourceRoot,
  workspaceRoot,
  ...spawnOptions
}) {
  const executable = resolveExecutable(command);
  if (!executable) {
    return {
      error: new Error(`executable not found: ${command}`),
      status: null,
      signal: null,
      pid: 0,
      stdout: '',
      stderr: '',
    };
  }
  if (process.platform === 'darwin' && existsSync('/usr/bin/sandbox-exec')) {
    const profile = `(version 1)\n(allow default)\n(deny file-read* (subpath "${seatbeltLiteral(sourceRoot)}"))`;
    return spawnSync('/usr/bin/sandbox-exec', ['-p', profile, executable, ...args], {
      cwd: workspaceRoot,
      ...spawnOptions,
    });
  }
  if (process.platform === 'linux') {
    const bwrap = resolveExecutable(process.env.BWRAP_BIN || 'bwrap');
    if (bwrap) {
      // Mask the source repo with an unreadable (mode 000) tmpfs inside a mount
      // namespace: any path traversal under sourceRoot fails with EACCES, matching
      // the macOS seatbelt deny semantics.
      return spawnSync(bwrap, [
        '--die-with-parent',
        '--dev-bind', '/', '/',
        '--perms', '0000',
        '--tmpfs', sourceRoot,
        '--',
        executable, ...args,
      ], {
        cwd: workspaceRoot,
        ...spawnOptions,
      });
    }
  }
  return {
    error: new Error('source-read isolation unavailable: live regressions require macOS /usr/bin/sandbox-exec or Linux bubblewrap (bwrap)'),
    status: null,
    signal: null,
    pid: 0,
    stdout: '',
    stderr: '',
  };
}

export function invocationLifecycle(result) {
  return {
    started: Number.isInteger(result?.pid) && result.pid > 0,
    completed: Number.isInteger(result?.status),
  };
}
