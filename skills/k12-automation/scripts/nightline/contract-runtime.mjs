import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, resolve } from 'path';

const DATE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;

function kindOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function validFormat(value, format) {
  if (format === 'date') {
    if (!DATE.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  if (format === 'date-time') {
    return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(new Date(value).valueOf());
  }
  if (format === 'uri') {
    try { return Boolean(new URL(value).protocol); }
    catch { return false; }
  }
  return true;
}

function matchesType(value, expected) {
  if (Array.isArray(expected)) return expected.some(item => matchesType(value, item));
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  return typeof value === expected;
}

function collectErrors(value, schema, at, errors) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    errors.push(`${at}: schema 必须是 JSON 对象`);
    return;
  }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${at}: 必须等于 ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some(item => item === value)) errors.push(`${at}: 不在允许值 ${JSON.stringify(schema.enum)} 中`);

  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${at}: 需要 ${Array.isArray(schema.type) ? schema.type.join('|') : schema.type}，实际为 ${kindOf(value)}`);
    return;
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: 长度小于 ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${at}: 长度大于 ${schema.maxLength}`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(`${at}: 不匹配 ${schema.pattern}`);
    if (schema.format && !validFormat(value, schema.format)) errors.push(`${at}: 不是有效 ${schema.format}`);
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: 小于 ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: 大于 ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: 项数小于 ${schema.minItems}`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: 项数大于 ${schema.maxItems}`);
    if (schema.items) value.forEach((item, index) => collectErrors(item, schema.items, `${at}[${index}]`, errors));
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const name of schema.required || []) {
      if (!Object.hasOwn(value, name)) errors.push(`${at}.${name}: 缺少必填字段`);
    }
    const properties = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const name of Object.keys(value)) {
        if (!Object.hasOwn(properties, name)) errors.push(`${at}.${name}: 不允许额外字段`);
      }
    }
    for (const [name, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, name)) collectErrors(value[name], childSchema, `${at}.${name}`, errors);
    }
  }

  for (const child of schema.allOf || []) collectErrors(value, child, at, errors);
  if (schema.if) {
    const conditionErrors = [];
    collectErrors(value, schema.if, at, conditionErrors);
    if (conditionErrors.length === 0 && schema.then) collectErrors(value, schema.then, at, errors);
    if (conditionErrors.length > 0 && schema.else) collectErrors(value, schema.else, at, errors);
  }
}

export function assertJsonSchema(value, schema, label) {
  const errors = [];
  collectErrors(value, schema, '$', errors);
  if (errors.length) throw new Error(`${label} 未通过 schema：${errors.slice(0, 8).join('；')}`);
  return value;
}

export function loadJsonSchema(path, label) {
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`缺少 ${label} schema：${path}`);
  let schema;
  try { schema = JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`${label} schema 不是有效 JSON：${error.message}`); }
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error(`${label} schema 顶层必须是 JSON 对象`);
  return schema;
}

export function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index > 0) meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return meta;
}

function schemaPath(adapterPath, relativePath, label) {
  if (!relativePath || /^(?:[a-z]+:|\/)/i.test(relativePath)) {
    throw new Error(`Learning adapter 的 ${label} 必须是相对 adapter 文件的本地路径`);
  }
  return resolve(dirname(adapterPath), relativePath);
}

const POLICY_SECTIONS = 'input-boundary,analysis-task,output-contract,red-lines';
const POLICY_RULES = 'evidence-first,single-primary-cause,history-threshold-3,adaptive-practice,mastery-criterion,no-state-inference,no-fake-side-effects';
const POLICY_STRUCTURE = [
  {
    heading: '## 输入边界',
    anchors: [
      'Automation v1 不直接读取 Learning State',
      '授权、模型提供方核验、读取文件、写入档案、移动 inbox 和发送提醒均不属于本契约',
    ],
  },
  {
    heading: '## 分析任务',
    anchors: [
      '首个可验证偏差',
      '只选择一个主错因',
      '只有至少 3 条可对应的记录',
      '生成 3–5 道变式',
      '给出掌握判据',
      '不得声称提醒已经创建',
    ],
  },
  {
    heading: '## 输出契约',
    anchors: ['只输出以下四节', 'Mock 与真实模型不得使用不同的解析或校验路径'],
  },
  {
    heading: '## 红线',
    anchors: [
      '不读取或臆造请求之外的学生数据',
      '不把一次错误写成稳定画像',
      '不输出内部 playbook 名称',
    ],
  },
];

function validatePolicyBody(meta, body) {
  if (meta.policy_sections !== POLICY_SECTIONS || meta.policy_rules !== POLICY_RULES) {
    throw new Error('Learning adapter policy identity 不完整；必须升版而不是静默删除教学规则');
  }
  let previous = -1;
  for (let index = 0; index < POLICY_STRUCTURE.length; index++) {
    const { heading, anchors } = POLICY_STRUCTURE[index];
    const start = body.indexOf(heading);
    if (start < 0 || start <= previous) throw new Error(`Learning adapter 缺少或打乱 policy section：${heading}`);
    const nextHeading = POLICY_STRUCTURE[index + 1]?.heading;
    const end = nextHeading ? body.indexOf(nextHeading, start + heading.length) : body.length;
    if (nextHeading && end < 0) throw new Error(`Learning adapter 缺少 policy section：${nextHeading}`);
    const section = body.slice(start, end);
    for (const anchor of anchors) {
      if (!section.includes(anchor)) throw new Error(`Learning adapter ${heading} 缺少关键行为：${anchor}`);
    }
    previous = start;
  }
}

export function loadNightAnalysisContract(adapterPath) {
  if (!existsSync(adapterPath) || !statSync(adapterPath).isFile()) {
    throw new Error(`缺少 Learning 夜间分析 adapter 契约：${adapterPath}`);
  }
  const text = readFileSync(adapterPath, 'utf8');
  if (text.length > 100000) throw new Error('Learning 夜间分析 adapter 契约超过 100000 字符');
  const meta = parseFrontmatter(text);
  if (meta.adapter_contract !== 'k12-learning/night-analysis' || meta.contract_version !== 'v1') {
    throw new Error('Learning adapter 契约不兼容：需要 k12-learning/night-analysis v1');
  }
  const body = text.replace(/^---\n[\s\S]*?\n---\s*/, '').trim();
  for (const marker of ['DIAGNOSIS', 'ARCHIVE', 'PROBLEMS', 'SOLUTIONS', 'END']) {
    if (!body.includes(`<<<${marker}>>>`)) throw new Error(`Learning adapter 契约缺少规定的输出标记 ${marker}`);
  }
  validatePolicyBody(meta, body);
  const requestSchema = loadJsonSchema(schemaPath(adapterPath, meta.request_schema, 'request_schema'), 'Learning request');
  const outputSchema = loadJsonSchema(schemaPath(adapterPath, meta.output_schema, 'output_schema'), 'Learning output');
  if (requestSchema.properties?.contract_version?.const !== 'v1'
    || outputSchema.properties?.contract_version?.const !== 'v1') {
    throw new Error('Learning adapter schema 版本与 contract_version 不一致');
  }
  return { id: meta.adapter_contract, version: meta.contract_version, body, requestSchema, outputSchema };
}

export function validateNightAnalysisRequest(contract, request) {
  return assertJsonSchema(request, contract.requestSchema, 'Learning adapter request');
}

function section(text, name) {
  const match = text.match(new RegExp(`<<<${name}>>>\\s*([\\s\\S]*?)(?=<<<[A-Z]+>>>|$)`));
  return match ? match[1].trim() : '';
}

export function parseNightAnalysisOutput(contract, text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('<<<DIAGNOSIS>>>')) throw new Error('Learning adapter output 必须以 <<<DIAGNOSIS>>> 开始');
  const markerOrder = ['DIAGNOSIS', 'ARCHIVE', 'PROBLEMS', 'SOLUTIONS', 'END'];
  let previous = -1;
  for (const marker of markerOrder) {
    const token = `<<<${marker}>>>`;
    const first = trimmed.indexOf(token);
    if (first < 0 || first <= previous || first !== trimmed.lastIndexOf(token)) {
      throw new Error(`Learning adapter output 的 ${token} 缺失、重复或顺序错误`);
    }
    previous = first;
  }
  if (!trimmed.endsWith('<<<END>>>')) throw new Error('Learning adapter output 必须以 <<<END>>> 结束');
  const archive = section(trimmed, 'ARCHIVE');
  const archiveMeta = parseFrontmatter(archive);
  const parsed = {
    contract_version: contract.version,
    diagnosis: section(trimmed, 'DIAGNOSIS'),
    archive: {
      content: archive,
      date: archiveMeta.date || '',
      subject: archiveMeta.subject || '',
      topic: archiveMeta.topic || '',
      error_type: archiveMeta.error_type || '',
      recurrence_count: /^\d+$/.test(String(archiveMeta.recurrence_count || '')) ? Number(archiveMeta.recurrence_count) : 0,
    },
    problems: section(trimmed, 'PROBLEMS'),
    solutions: section(trimmed, 'SOLUTIONS'),
  };
  return assertJsonSchema(parsed, contract.outputSchema, 'Learning adapter output');
}
