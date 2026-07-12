import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const DEFAULT_CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), 'config.json');

function parseConfig(configPath) {
  if (!existsSync(configPath)) {
    throw new Error(`缺少配置文件：${configPath}`);
  }
  let parsed;
  try { parsed = JSON.parse(readFileSync(configPath, 'utf8')); }
  catch (error) { throw new Error(`配置文件不是有效 JSON：${error.message}`); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('配置文件顶层必须是 JSON 对象');
  }
  return parsed;
}

export function loadRuntimeConfig({ configPath = DEFAULT_CONFIG_PATH, mock = false } = {}) {
  if (mock && !existsSync(configPath)) {
    return { apibase: '', key: '', model: 'mock-llm', learningAdapter: '' };
  }

  const parsed = parseConfig(configPath);
  if (parsed.learningAdapter !== undefined && typeof parsed.learningAdapter !== 'string') {
    throw new Error('config.json 的 learningAdapter 必须是路径字符串或空字符串');
  }
  if (mock) {
    return {
      ...parsed,
      apibase: String(parsed.apibase || '').trim().replace(/\/+$/, ''),
      key: typeof parsed.key === 'string' ? parsed.key.trim() : '',
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : 'mock-llm',
      learningAdapter: String(parsed.learningAdapter || '').trim(),
    };
  }

  const apibase = String(parsed.apibase || '').trim().replace(/\/+$/, '');
  let endpoint;
  try { endpoint = new URL(apibase); }
  catch { throw new Error('config.json 的 apibase 必须是绝对 http(s) URL'); }
  if (!['http:', 'https:'].includes(endpoint.protocol) || !endpoint.hostname) {
    throw new Error('config.json 的 apibase 必须是绝对 http(s) URL');
  }
  if (endpoint.hostname === 'your-openai-compatible-endpoint') {
    throw new Error('config.json 的 apibase 仍是示例占位值，请填写真实的模型服务地址');
  }
  if (typeof parsed.key !== 'string' || !parsed.key.trim()) {
    throw new Error('config.json 的 key 必须是非空字符串');
  }
  if (typeof parsed.model !== 'string' || !parsed.model.trim()) {
    throw new Error('config.json 的 model 必须是非空字符串');
  }
  if (parsed.key.includes('REPLACE-WITH-YOUR-OWN-KEY')) {
    throw new Error('config.json 的 key 仍是示例占位值，请填写真实的 API key');
  }
  return {
    ...parsed,
    apibase,
    key: parsed.key.trim(),
    model: parsed.model.trim(),
    learningAdapter: String(parsed.learningAdapter || '').trim(),
  };
}
