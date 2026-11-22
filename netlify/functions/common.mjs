import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TABLES = new Set(['questions', 'videos', 'chat_logs', 'campaign_admins', 'video_upload_tickets']);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(statusCode, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function legacyHandler(handler) {
  return async (request, context) => {
    if (!(request instanceof Request)) {
      throw new TypeError('Expected a Web Request from the Netlify Functions runtime.');
    }

    const url = new URL(request.url);
    const event = {
      httpMethod: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: ['GET', 'HEAD'].includes(request.method) ? '' : await request.text(),
      isBase64Encoded: false,
      rawQuery: url.search.slice(1),
      path: url.pathname,
    };
    const result = await handler(event, context);

    if (result instanceof Response || result === undefined) return result;
    if (!result || typeof result !== 'object' || !Number.isInteger(result.statusCode)) {
      throw new TypeError('Handler returned an invalid response.');
    }
    return new Response(result.body ?? null, {
      status: result.statusCode,
      headers: result.headers,
    });
  };
}

export function text(value, field, max, required = false) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `Invalid ${field}.`);
  }
  const result = value.trim();
  if ((required && !result) || [...result].length > max) {
    throw new HttpError(400, `Please check the ${field} field.`);
  }
  return result;
}

export function parseBody(event, maxBytes = 256 * 1024) {
  const raw = event.body || '';
  if (Buffer.byteLength(raw, event.isBase64Encoded ? 'base64' : 'utf8') > maxBytes) {
    throw new HttpError(413, 'The request is too large.');
  }
  try {
    const body = JSON.parse(event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid object');
    return body;
  } catch {
    throw new HttpError(400, 'Invalid request body.');
  }
}

export function assertPublicRequest(event) {
  if (event.headers?.['x-adg'] !== '1') {
    throw new HttpError(403, 'Request could not be verified.');
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(503, 'The service is not configured. Contact the campaign administrator.');
  return value;
}

function appKey() {
  const value = requiredEnv('CAMPAIGN_APP_KEY');
  if (value.length < 32) throw new HttpError(503, 'The service is not configured. Contact the campaign administrator.');
  return value;
}

export function issueFormToken() {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(18).toString('base64url');
  const content = `${timestamp}.${nonce}`;
  const signature = createHmac('sha256', appKey()).update(content).digest('base64url');
  return `${content}.${signature}`;
}

export function verifyFormToken(token) {
  if (typeof token !== 'string' || token.length > 200) {
    throw new HttpError(403, 'Your session expired. Refresh the page and try again.');
  }
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d{10}$/.test(parts[0]) || !/^[A-Za-z0-9_-]{20,40}$/.test(parts[1])) {
    throw new HttpError(403, 'Your session expired. Refresh the page and try again.');
  }
  const age = Math.floor(Date.now() / 1000) - Number(parts[0]);
  if (age < 0 || age > 2 * 60 * 60) {
    throw new HttpError(403, 'Your session expired. Refresh the page and try again.');
  }
  const expected = createHmac('sha256', appKey()).update(`${parts[0]}.${parts[1]}`).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], 'base64url');
  } catch {
    throw new HttpError(403, 'Your session expired. Refresh the page and try again.');
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new HttpError(403, 'Your session expired. Refresh the page and try again.');
  }
}

export function clientKey(event, scope) {
  const ip = event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-forwarded-for']?.split(',')[0]?.trim();
  if (!ip) throw new HttpError(503, 'Could not verify the request source. Please try again.');
  return createHmac('sha256', appKey()).update(`${scope}:${ip}`).digest('hex');
}

export async function supabase(path, options = {}) {
  const base = requiredEnv('SUPABASE_URL').replace(/\/+$/, '');
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }
  if (!response.ok) {
    console.error('Supabase request failed.', response.status, typeof data === 'string' ? data.slice(0, 300) : data?.message || data?.error);
    throw new HttpError(response.status === 404 ? 404 : 503, 'The service could not complete this request. Please try again.');
  }
  return { response, data };
}

export async function insertRow(table, row, returning = false) {
  if (!TABLES.has(table)) throw new HttpError(400, 'Invalid record type.');
  const prefer = returning ? 'return=representation' : 'return=minimal';
  return supabase(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: prefer },
    body: JSON.stringify(row),
  });
}

export async function getRow(table, query) {
  if (!TABLES.has(table)) throw new HttpError(400, 'Invalid record type.');
  const { data } = await supabase(`/rest/v1/${table}?${query}`);
  return Array.isArray(data) ? data : [];
}

export async function rateLimit(event, scope, limit, windowSeconds) {
  const keyHash = clientKey(event, scope);
  const { data } = await supabase('/rest/v1/rpc/dumle_record_rate_hit', {
    method: 'POST',
    body: JSON.stringify({
      p_scope: scope,
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }),
  });
  const hits = Number(data);
  if (!Number.isSafeInteger(hits) || hits < 1) {
    throw new HttpError(503, 'Rate limiting is unavailable. Please try again later.');
  }
  if (hits > limit) throw new HttpError(429, 'Too many requests. Please wait and try again.');
}

export async function requireAdmin(event) {
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  const match = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(authorization);
  if (!match) throw new HttpError(401, 'Please sign in again.');

  const base = requiredEnv('SUPABASE_URL').replace(/\/+$/, '');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  const userResponse = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${match[1]}` },
  });
  if (!userResponse.ok) throw new HttpError(401, 'Please sign in again.');
  const user = await userResponse.json();
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new HttpError(401, 'Please sign in again.');
  }

  const rows = await getRow('campaign_admins', `select=user_id,email,active&user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&limit=1`);
  if (!rows.length) throw new HttpError(403, 'This account does not have campaign administrator access.');
  return { id: user.id, username: rows[0].email || user.email };
}

export async function storage(path, options = {}) {
  return supabase(`/storage/v1${path}`, options);
}

export function safeMessage(error) {
  if (error instanceof HttpError) return error.message;
  console.error('Unhandled function error.', error);
  return 'The request could not be completed. Please try again.';
}
