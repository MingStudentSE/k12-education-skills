export const DEFAULT_BUSINESS_TIME_ZONE = 'Asia/Shanghai';

const formatterCache = new Map();

export function resolveBusinessTimeZone(value = process.env.K12_TIME_ZONE) {
  const candidate = value === undefined ? DEFAULT_BUSINESS_TIME_ZONE : String(value).trim();
  if (!candidate) {
    throw new Error('无效的 K12_TIME_ZONE：值不能为空；请使用 IANA 时区，例如 Asia/Shanghai 或 UTC');
  }
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: candidate }).resolvedOptions().timeZone;
  } catch {
    throw new Error(`无效的 K12_TIME_ZONE "${candidate}"：请使用 IANA 时区，例如 Asia/Shanghai 或 UTC`);
  }
}

export const BUSINESS_TIME_ZONE = resolveBusinessTimeZone();

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`无效的业务时间：${String(value)}`);
  return date;
}

function businessParts(value, timeZone) {
  const date = validDate(value);
  const zone = resolveBusinessTimeZone(timeZone);
  let formatter = formatterCache.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatterCache.set(zone, formatter);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );
  return { date, ...parts };
}

export function businessDate(value = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const { year, month, day } = businessParts(value, timeZone);
  return `${year}-${month}-${day}`;
}

export function businessFileTimestamp(value = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const { date, year, month, day, hour, minute, second } = businessParts(value, timeZone);
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hour}-${minute}-${second}-${milliseconds}-${date.getTime()}`;
}
