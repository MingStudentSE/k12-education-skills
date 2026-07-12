#!/usr/bin/env node
import { createServer } from 'http';
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { spawn, spawnSync } from 'child_process';
import { once } from 'events';
import {
  AUTOMATION_STATE_SCHEMA,
  EXTERNAL_PROCESSING_SCOPE,
} from '../skills/k12-automation/scripts/nightline/authorization.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ENGINE_SOURCE = join(ROOT, 'skills/k12-automation/scripts/nightline');
const SERVER = join(ENGINE_SOURCE, 'server.mjs');
const tempRoot = mkdtempSync(join(tmpdir(), 'k12-server-smoke-'));
const children = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function freePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  probe.close();
  await once(probe, 'close');
  return port;
}

function createServerHarness(name, configText) {
  const engineDir = join(tempRoot, 'server-harnesses', name);
  mkdirSync(engineDir, { recursive: true });
  for (const file of ['server.mjs', 'authorization.mjs', 'business-time.mjs']) {
    copyFileSync(join(ENGINE_SOURCE, file), join(engineDir, file));
  }
  if (configText !== undefined) writeFileSync(join(engineDir, 'config.json'), configText);
  return join(engineDir, 'server.mjs');
}

async function startApp({ dataRoot, mock, serverPath = SERVER }) {
  const port = await freePort();
  const env = { ...process.env, K12_ROOT: dataRoot, K12_PORT: String(port) };
  if (mock) env.K12_MOCK_LLM = '1'; else delete env.K12_MOCK_LLM;
  delete env.K12_CONFIG_PATH;
  const child = spawn(process.execPath, [serverPath], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const state = { child, output: '' };
  children.push(state);
  child.stdout.on('data', chunk => state.output += chunk);
  child.stderr.on('data', chunk => state.output += chunk);
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error(`server exited before listen: ${state.output}`);
    try { const response = await fetch(base + '/'); if (response.ok) return { ...state, base }; }
    catch { /* retry */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`server did not start: ${state.output}`);
}

const post = (base, path, body) => fetch(base + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const postRaw = (base, path, body) => fetch(base + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
});
const readJson = async response => {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { throw new Error(`expected JSON response (${response.status}), got: ${text.slice(0, 200)}`); }
};
const imageOfLength = length => {
  const prefix = 'data:image/png;base64,';
  assert(length >= prefix.length, 'image fixture length too short');
  return prefix + 'A'.repeat(length - prefix.length);
};

async function stopChildren() {
  for (const state of children) {
    if (state.child.exitCode !== null) continue;
    state.child.kill('SIGTERM');
    await Promise.race([once(state.child, 'close'), new Promise(resolve => setTimeout(resolve, 1000))]);
  }
}

async function assertConfigFailure(name, serverPath) {
  const port = await freePort();
  const env = { ...process.env, K12_ROOT: join(tempRoot, `invalid-${name}`), K12_PORT: String(port) };
  delete env.K12_MOCK_LLM;
  delete env.K12_CONFIG_PATH;
  const result = spawnSync(process.execPath, [serverPath], { cwd: ROOT, env, encoding: 'utf8', timeout: 3000 });
  assert(Number.isInteger(result.status) && result.status !== 0, `${name}: invalid config did not exit non-zero`);
  assert(`${result.stdout}${result.stderr}`.includes('FATAL:'), `${name}: missing controlled startup error`);
  assert(!`${result.stdout}${result.stderr}`.includes('控制台已启动'), `${name}: server listened before config rejection`);
}

let providerCalls = 0;
const provider = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  providerCalls++;
  assert(req.url === '/v1/chat/completions', `unexpected provider path: ${req.url}`);
  assert(req.headers.authorization === 'Bearer smoke-key', 'provider did not receive configured key');
  const payload = JSON.parse(body);
  assert(payload.model === 'vision-smoke', 'provider did not receive configured model');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ choices: [{ message: { content: '# 题目原文\nMock OCR\n# 学生的卷面步骤\n无\n# 可见批注/背景\n无' } }] }));
});

try {
  const missingServer = createServerHarness('missing');
  const invalidJsonServer = createServerHarness('invalid-json', '{not-json');
  const relativeUrlServer = createServerHarness('relative-url', JSON.stringify({ apibase: '/v1', key: 'x', model: 'm' }));
  const ftpUrlServer = createServerHarness('ftp-url', JSON.stringify({ apibase: 'ftp://example.com/v1', key: 'x', model: 'm' }));
  const emptyKeyServer = createServerHarness('empty-key', JSON.stringify({ apibase: 'https://example.com/v1', key: ' ', model: 'm' }));
  const emptyModelServer = createServerHarness('empty-model', JSON.stringify({ apibase: 'https://example.com/v1', key: 'x', model: '' }));
  const sampleEndpointServer = createServerHarness('sample-endpoint', JSON.stringify({
    apibase: 'https://your-openai-compatible-endpoint/v1', key: 'real-key', model: 'm',
  }));
  const sampleKeyServer = createServerHarness('sample-key', JSON.stringify({
    apibase: 'https://example.com/v1', key: 'sk-REPLACE-WITH-YOUR-OWN-KEY', model: 'm',
  }));
  await assertConfigFailure('missing', missingServer);
  await assertConfigFailure('invalid-json', invalidJsonServer);
  await assertConfigFailure('relative-url', relativeUrlServer);
  await assertConfigFailure('ftp-url', ftpUrlServer);
  await assertConfigFailure('empty-key', emptyKeyServer);
  await assertConfigFailure('empty-model', emptyModelServer);
  await assertConfigFailure('sample-endpoint', sampleEndpointServer);
  await assertConfigFailure('sample-key', sampleKeyServer);

  const mockRoot = join(tempRoot, 'mock-root');
  const mock = await startApp({ dataRoot: mockRoot, mock: true });
  assert((await post(mock.base, '/api/student', { id: 'no-consent' })).status === 400, 'missing consent must be 400');
  assert((await post(mock.base, '/api/student', { id: 'shallow', consent: true, authorizedBy: 'x' })).status === 400, 'shallow authorization must be 400');
  const create = await post(mock.base, '/api/student', {
    id: 'stu-test', name: '测试同学', grade: '初二', subjects: 'math', bio: '低敏学习摘要',
    consent: true, authorizationSubject: 'guardian', authorizationDate: '2026-07-11',
    authorizationMethod: 'written', externalProcessingConsent: false,
  });
  const createBody = await readJson(create);
  assert(create.status === 200, `valid student creation must be 200: ${JSON.stringify(createBody)}`);
  assert(createBody.learningProfileCreated === false, 'Automation must declare that it did not create Learning State');
  const profilePath = join(mockRoot, 'students/stu-test/profile.md');
  const statePath = join(mockRoot, 'students/stu-test/automation/state.json');
  assert(!existsSync(profilePath), 'Automation /api/student created Learning-owned profile.md');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  assert(state.schema_version === AUTOMATION_STATE_SCHEMA, 'Automation state schema/version missing');
  assert(state.authorization.local.subject === 'guardian', 'structured subject missing from Automation state');
  assert(state.authorization.external_processing.authorized === false, 'external consent default missing from Automation state');
  assert(!readFileSync(statePath, 'utf8').includes('低敏学习摘要'), 'arbitrary bio leaked into Automation state');

  const learningProfile = `---\nid: stu-test\nname: 测试同学\ngrade: 初二\nsubjects: [math]\n---\n\n# Learning-owned profile\n\n低敏学习摘要\n`;
  writeFileSync(profilePath, learningProfile);
  const mockHome = await (await fetch(mock.base + '/')).text();
  assert(mockHome.includes('stu-test'), 'authorized homepage must show the low-sensitivity Automation ID');
  assert(!mockHome.includes('测试同学') && !mockHome.includes('低敏学习摘要'), 'Automation homepage read Learning profile fields/body');
  assert(mockHome.includes('更新/撤回授权') && mockHome.includes('支持视觉输入'), 'authorization UI or visual-model notice missing');
  assert((await post(mock.base, '/api/mistake', { student: 'stu-test', subject: 'math', content: '1 + 1 = 3' })).status === 200, 'authorized write must succeed');
  assert((await post(mock.base, '/api/ocr', { images: [imageOfLength(100)] })).status === 400, 'OCR without one-time consent must be 400');

  writeFileSync(join(mockRoot, 'students/stu-test/inbox/a-too-large.md'), 'x'.repeat(20001));
  const partial = await post(mock.base, '/api/run', { student: 'stu-test' });
  const partialBody = await readJson(partial);
  assert(partial.status === 500, 'partial batch failure must be HTTP 500');
  assert(String(partialBody.error || '').includes('✗'), 'partial failure must return failed item, not a success summary');

  const mockRevoke = await post(mock.base, '/api/authorization', {
    student: 'stu-test', action: 'revoke-local', confirmation: true,
    authorizationSubject: 'student', authorizationDate: '2026-07-11', authorizationMethod: 'digital',
  });
  assert(mockRevoke.status === 200, `mock local revocation failed: ${await mockRevoke.text()}`);
  assert(readFileSync(profilePath, 'utf8') === learningProfile, 'authorization update modified Learning-owned profile');
  assert((await post(mock.base, '/api/mistake', { student: 'stu-test', subject: 'math', content: '2 + 2 = 5' })).status === 403, 'revoked write must be 403');
  const home = await (await fetch(mock.base + '/')).text();
  assert(!home.includes('测试同学') && !home.includes('低敏学习摘要'), 'revoked homepage must not expose profile data');
  const dashboardRun = spawnSync(process.execPath, [join(ENGINE_SOURCE, 'build-dashboard.mjs')], { cwd: ROOT, env: { ...process.env, K12_ROOT: mockRoot }, encoding: 'utf8' });
  assert(dashboardRun.status === 0, `dashboard generation failed: ${dashboardRun.stderr}`);
  const dashboard = readFileSync(join(mockRoot, 'dashboard.html'), 'utf8');
  assert(!dashboard.includes('测试同学') && !dashboard.includes('低敏学习摘要') && !dashboard.includes('evidence-based'), 'revoked dashboard must exclude student data');
  const outDays = readdirSync(join(mockRoot, 'students/stu-test/outbox'));
  if (outDays.length) {
    const files = readdirSync(join(mockRoot, 'students/stu-test/outbox', outDays[0]));
    if (files.length) {
      const url = `${mock.base}/api/file?student=stu-test&day=${outDays[0]}&name=${encodeURIComponent(files[0])}`;
      assert((await fetch(url)).status === 403, 'revoked output read must be 403');
    }
  }

  provider.listen(0, '127.0.0.1');
  await once(provider, 'listening');
  const providerPort = provider.address().port;
  const providerOrigin = `http://127.0.0.1:${providerPort}`;
  const validServer = createServerHarness('valid', JSON.stringify({
    apibase: `${providerOrigin}/v1`, key: 'smoke-key', model: 'vision-smoke', learningAdapter: '',
  }));
  const realRoot = join(tempRoot, 'real-root');
  const real = await startApp({ dataRoot: realRoot, mock: false, serverPath: validServer });
  const realCreate = await post(real.base, '/api/student', {
    id: 'stu-auth', name: '授权生命周期学生', grade: '初二', subjects: 'math', bio: '生命周期测试',
    consent: true, authorizationSubject: 'guardian', authorizationDate: '2026-07-11',
    authorizationMethod: 'written', externalProcessingConsent: false,
  });
  assert(realCreate.status === 200, `real-mode student creation failed: ${await realCreate.text()}`);
  assert((await post(real.base, '/api/authorization', { student: 'stu-auth', action: 'update', confirmation: true })).status === 400, 'authorization update without structured evidence must fail');
  assert((await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'update', confirmation: false,
    authorizationSubject: 'guardian', authorizationDate: '2026-07-11', authorizationMethod: 'written', externalProcessingConsent: true,
  })).status === 400, 'authorization update without explicit confirmation must fail');

  const externalGrant = await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'update', confirmation: true,
    authorizationSubject: 'guardian', authorizationDate: '2026-07-11', authorizationMethod: 'digital', externalProcessingConsent: true,
  });
  const externalGrantBody = await readJson(externalGrant);
  assert(externalGrant.status === 200 && externalGrantBody.localAuthorized && externalGrantBody.externalAuthorized, 'external grant/update failed');
  assert(externalGrantBody.provider === providerOrigin, 'external authorization did not use config origin');
  const realProfilePath = join(realRoot, 'students/stu-auth/profile.md');
  const realStatePath = join(realRoot, 'students/stu-auth/automation/state.json');
  assert(!existsSync(realProfilePath), 'real-mode Automation registration created a Learning profile');
  let authState = JSON.parse(readFileSync(realStatePath, 'utf8'));
  assert(authState.authorization.external_processing.provider === providerOrigin, 'Automation state missing external provider origin');
  assert(authState.authorization.external_processing.scope === EXTERNAL_PROCESSING_SCOPE, 'Automation state missing fixed external scope');

  const externalRevoke = await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'revoke-external', confirmation: true,
    authorizationSubject: 'student', authorizationDate: '2026-07-11', authorizationMethod: 'verbal', externalProcessingConsent: true,
  });
  const externalRevokeBody = await readJson(externalRevoke);
  assert(externalRevoke.status === 200 && externalRevokeBody.localAuthorized && !externalRevokeBody.externalAuthorized, 'external-only revocation failed');
  authState = JSON.parse(readFileSync(realStatePath, 'utf8'));
  assert(authState.authorization.local.authorized && !authState.authorization.external_processing.authorized, 'external-only revocation did not preserve local authorization');
  assert(authState.authorization.local.subject === 'student' && authState.authorization.local.method === 'verbal', 'external revocation did not recollect structured evidence');
  assert((await post(real.base, '/api/mistake', { student: 'stu-auth', subject: 'math', content: '3 + 3 = 7' })).status === 200, 'external-only revocation incorrectly blocked local write');

  const externalRestore = await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'update', confirmation: true,
    authorizationSubject: 'guardian', authorizationDate: '2026-07-11', authorizationMethod: 'written', externalProcessingConsent: true,
  });
  const externalRestoreBody = await readJson(externalRestore);
  assert(externalRestore.status === 200 && externalRestoreBody.externalAuthorized, 'external authorization restore failed');

  const ocr = await post(real.base, '/api/ocr', { images: [imageOfLength(100)], externalProcessingConsent: true });
  const ocrBody = await readJson(ocr);
  assert(ocr.status === 200 && String(ocrBody.text).includes('Mock OCR'), 'valid OCR did not reach configured visual model');
  assert((await post(real.base, '/api/ocr', { images: Array.from({ length: 7 }, () => imageOfLength(100)), externalProcessingConsent: true })).status === 400, 'seven OCR images must fail');
  assert((await post(real.base, '/api/ocr', { images: [imageOfLength(8_000_001)], externalProcessingConsent: true })).status === 400, 'oversized single OCR image must fail');
  assert((await post(real.base, '/api/ocr', { images: Array.from({ length: 4 }, () => imageOfLength(6_100_000)), externalProcessingConsent: true })).status === 400, 'OCR total over 24,000,000 chars must fail');
  assert(providerCalls === 1, `rejected OCR requests reached provider; calls=${providerCalls}`);

  const oversizedPayload = JSON.stringify({ padding: 'x'.repeat(25_000_100) });
  const payloadResponse = await postRaw(real.base, '/api/ocr', oversizedPayload);
  const payloadBody = await readJson(payloadResponse);
  assert(payloadResponse.status === 413 && /超过.*25000000/.test(payloadBody.error), `oversized payload must return JSON 413: ${JSON.stringify(payloadBody)}`);

  const localRevoke = await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'revoke-local', confirmation: true,
    authorizationSubject: 'student', authorizationDate: '2026-07-11', authorizationMethod: 'digital', externalProcessingConsent: true,
  });
  const localRevokeBody = await readJson(localRevoke);
  assert(localRevoke.status === 200 && !localRevokeBody.localAuthorized && !localRevokeBody.externalAuthorized, 'local revocation failed');
  authState = JSON.parse(readFileSync(realStatePath, 'utf8'));
  assert(!authState.authorization.local.authorized && !authState.authorization.external_processing.authorized, 'local revocation did not clear both scopes');
  assert((await post(real.base, '/api/mistake', { student: 'stu-auth', subject: 'math', content: '4 + 4 = 9' })).status === 403, 'local revocation did not block writes');
  assert((await post(real.base, '/api/authorization', {
    student: 'stu-auth', action: 'revoke-external', confirmation: true,
    authorizationSubject: 'guardian', authorizationDate: '2026-07-11', authorizationMethod: 'written',
  })).status === 409, 'external-only revoke must not silently restore revoked local authorization');

  console.log('server smoke: eager config, JSON 413, OCR limits, authorization lifecycle and prior runtime gates passed');
} finally {
  await stopChildren();
  if (provider.listening) {
    provider.close();
    await once(provider, 'close');
  }
  rmSync(tempRoot, { recursive: true, force: true });
}
