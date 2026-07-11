#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  DEFAULT_BUSINESS_TIME_ZONE,
  businessDate,
  businessFileTimestamp,
  resolveBusinessTimeZone,
} from '../skills/k12-automation/scripts/nightline/business-time.mjs';

const FIXED_INSTANT = '2026-07-11T17:30:00.000Z';
const fixedDate = new Date(FIXED_INSTANT);
const helperUrl = new URL('../skills/k12-automation/scripts/nightline/business-time.mjs', import.meta.url).href;

assert.equal(DEFAULT_BUSINESS_TIME_ZONE, 'Asia/Shanghai');
assert.equal(resolveBusinessTimeZone(DEFAULT_BUSINESS_TIME_ZONE), DEFAULT_BUSINESS_TIME_ZONE);
assert.equal(businessDate(fixedDate, DEFAULT_BUSINESS_TIME_ZONE), '2026-07-12');
assert.equal(businessDate(fixedDate, 'UTC'), '2026-07-11');
assert.throws(() => resolveBusinessTimeZone('Mars/Olympus'), /无效的 K12_TIME_ZONE/);

const filenameTimestamp = businessFileTimestamp(fixedDate, DEFAULT_BUSINESS_TIME_ZONE);
assert.match(filenameTimestamp, /^2026-07-12T01-30-00-000-\d+$/);
assert.doesNotMatch(filenameTimestamp, /[/:\\\0]/);

function runWithTimeZone(timeZone) {
  const env = { ...process.env };
  if (timeZone === undefined) delete env.K12_TIME_ZONE;
  else env.K12_TIME_ZONE = timeZone;
  const code = `
    import { BUSINESS_TIME_ZONE, businessDate, businessFileTimestamp } from ${JSON.stringify(helperUrl)};
    const instant = new Date(${JSON.stringify(FIXED_INSTANT)});
    console.log(JSON.stringify({
      timeZone: BUSINESS_TIME_ZONE,
      date: businessDate(instant),
      filenameTimestamp: businessFileTimestamp(instant),
    }));
  `;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], { env, encoding: 'utf8' });
}

const defaultRun = runWithTimeZone(undefined);
assert.equal(defaultRun.status, 0, defaultRun.stderr);
assert.deepEqual(JSON.parse(defaultRun.stdout), {
  timeZone: 'Asia/Shanghai',
  date: '2026-07-12',
  filenameTimestamp,
});

const utcRun = runWithTimeZone('UTC');
assert.equal(utcRun.status, 0, utcRun.stderr);
const utcOutput = JSON.parse(utcRun.stdout);
assert.equal(utcOutput.timeZone, 'UTC');
assert.equal(utcOutput.date, '2026-07-11');
assert.match(utcOutput.filenameTimestamp, /^2026-07-11T17-30-00-000-\d+$/);

const invalidRun = runWithTimeZone('Mars/Olympus');
assert.notEqual(invalidRun.status, 0);
assert.match(invalidRun.stderr, /无效的 K12_TIME_ZONE "Mars\/Olympus"/);

console.log('business time contract: default Asia/Shanghai, UTC override, safe filename, invalid zone rejection passed');
