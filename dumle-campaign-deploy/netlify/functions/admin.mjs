import {
  getRow, HttpError, insertRow, json, legacyHandler, parseBody, rateLimit, requireAdmin,
  safeMessage, storage, supabase, text,
} from './common.mjs';

const TYPES = {
  questions: { table: 'questions', searchable: ['question', 'name', 'contact', 'website', 'lga'] },
  videos: { table: 'videos', searchable: ['name', 'contact', 'lga', 'ward', 'topic', 'original_name'] },
  chat: { table: 'chat_logs', searchable: ['session_id', 'question', 'answer', 'sources'] },
};
const STATUSES = new Set(['new', 'in_progress', 'resolved', 'spam']);
const BUCKET = 'dumle-community-videos';

function queryAction(event) {
  return new URLSearchParams(event.rawQuery || '').get('action') || '';
}

function csvCell(value) {
  let cell = String(value ?? '');
  if (/^[\u0000-\u0020]*[=+\-@]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}

async function count(table, filters = '') {
  const { response } = await supabase(`/rest/v1/${table}?select=id${filters}`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact', Range: '0-0' },
  });
  const match = /\/(\d+)$/.exec(response.headers.get('content-range') || '');
  return match ? Number(match[1]) : 0;
}

async function requireIdentity(event) {
  const identity = await requireAdmin(event);
  return identity;
}

async function handler(event) {
  const action = queryAction(event);
  try {
    if (action === 'csrf') {
      return json(200, { ok: true, csrf: 'bearer-token-authentication' });
    }

    if (action === 'login') {
      if (event.httpMethod !== 'POST') throw new HttpError(405, 'Method not allowed.');
      await rateLimit(event, 'admin-login', 8, 900);
      const input = parseBody(event);
      const email = text(input.username || input.email || '', 'email', 254, true).toLowerCase();
      const password = input.password;
      if (typeof password !== 'string' || password.length < 1 || password.length > 128) {
        throw new HttpError(400, 'Invalid email or password.');
      }

      const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
      const anonKey = process.env.SUPABASE_ANON_KEY;
      if (!base || !anonKey) throw new HttpError(503, 'Sign-in is not configured. Contact the site administrator.');
      const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const session = await response.json().catch(() => ({}));
      if (!response.ok || !session.access_token || !session.user?.id) {
        throw new HttpError(401, 'Invalid email or password.');
      }
      const admin = await requireIdentity({
        ...event,
        headers: { ...event.headers, authorization: `Bearer ${session.access_token}` },
      });
      return json(200, {
        ok: true,
        admin: { username: admin.username },
        csrf: 'bearer-token-authentication',
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      });
    }

    if (action === 'refresh') {
      if (event.httpMethod !== 'POST') throw new HttpError(405, 'Method not allowed.');
      await rateLimit(event, 'admin-refresh', 30, 900);
      const input = parseBody(event);
      const refreshToken = text(input.refresh_token || '', 'session', 4096, true);
      const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
      const anonKey = process.env.SUPABASE_ANON_KEY;
      if (!base || !anonKey) throw new HttpError(503, 'Sign-in is not configured. Contact the site administrator.');
      const response = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const session = await response.json().catch(() => ({}));
      if (!response.ok || !session.access_token || !session.user?.id) {
        throw new HttpError(401, 'Please sign in again.');
      }
      const refreshedAdmin = await requireIdentity({
        ...event,
        headers: { ...event.headers, authorization: `Bearer ${session.access_token}` },
      });
      return json(200, {
        ok: true,
        admin: { username: refreshedAdmin.username },
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      });
    }

    if (action === 'session') {
      if (event.httpMethod !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const admin = await requireIdentity(event);
      return json(200, { ok: true, admin: { username: admin.username }, csrf: 'bearer-token-authentication' });
    }

    if (action === 'logout') {
      if (event.httpMethod !== 'POST') throw new HttpError(405, 'Method not allowed.');
      await requireIdentity(event);
      const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
      const anonKey = process.env.SUPABASE_ANON_KEY;
      const authorization = event.headers?.authorization || event.headers?.Authorization || '';
      const response = await fetch(`${base}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: authorization },
      });
      if (!response.ok) throw new HttpError(503, 'Sign-out could not be completed. Please try again.');
      return json(200, { ok: true });
    }

    const admin = await requireIdentity(event);

    if (action === 'summary') {
      if (event.httpMethod !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const [questions, newQuestions, videos, newVideos, chats] = await Promise.all([
        count('questions'),
        count('questions', '&status=eq.new'),
        count('videos'),
        count('videos', '&status=eq.new'),
        count('chat_logs'),
      ]);
      const { data: sessions } = await supabase('/rest/v1/rpc/dumle_count_recent_sessions', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return json(200, {
        ok: true,
        admin: { username: admin.username },
        summary: {
          questions,
          new_questions: newQuestions,
          videos,
          new_videos: newVideos,
          chats,
          sessions: Number(sessions),
        },
      });
    }

    if (action === 'records' || action === 'export') {
      if (event.httpMethod !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const query = new URLSearchParams(event.rawQuery || '');
      const type = query.get('type') || 'questions';
      const config = TYPES[type];
      if (!config) throw new HttpError(400, 'Invalid record type.');
      const search = (query.get('q') || '').trim().slice(0, 120);
      const status = query.get('status') || '';
      const params = new URLSearchParams({ select: '*' });
      if (status && type !== 'chat') {
        if (!STATUSES.has(status)) throw new HttpError(400, 'Invalid status filter.');
        params.set('status', `eq.${status}`);
      }
      if (search) {
        const safeSearch = search.replace(/[,*()%\\]/g, ' ').replace(/\s+/g, ' ').trim();
        if (safeSearch) {
          params.set('or', `(${config.searchable.map((column) => `${column}.ilike.*${safeSearch}*`).join(',')})`);
        }
      }
      params.set('order', 'created_at.desc');
      const offset = Math.max(0, Math.min(50000, Number(query.get('offset')) || 0));
      const isExport = action === 'export';
      const limit = isExport ? 10000 : 50;
      params.set('limit', String(limit));
      if (!isExport) params.set('offset', String(offset));
      const { response, data } = await supabase(`/rest/v1/${config.table}?${params}`, {
        headers: { Prefer: 'count=exact' },
      });
      const records = Array.isArray(data) ? data : [];
      if (isExport) {
        const columns = type === 'questions'
          ? ['id', 'name', 'contact', 'website', 'lga', 'question', 'status', 'created_at']
          : type === 'videos'
            ? ['id', 'name', 'contact', 'lga', 'ward', 'topic', 'original_name', 'size_bytes', 'status', 'created_at']
            : ['id', 'session_id', 'question', 'answer', 'sources', 'channel', 'created_at'];
        const csv = [columns.map(csvCell).join(','), ...records.map((record) => columns.map((column) => csvCell(record[column])).join(','))].join('\r\n');
        return new Response(`\uFEFF${csv}`, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="ask-dumle-maol-${type}.csv"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      const total = Number(/\/(\d+)$/.exec(response.headers.get('content-range') || '')?.[1] || records.length);
      return json(200, { ok: true, records, limit, offset, total });
    }

    if (action === 'update') {
      if (event.httpMethod !== 'POST') throw new HttpError(405, 'Method not allowed.');
      const input = parseBody(event);
      if (!['questions', 'videos'].includes(input.type) || !STATUSES.has(input.status)) {
        throw new HttpError(400, 'Invalid status update.');
      }
      const id = text(input.id || '', 'record ID', 80, true);
      const { response } = await supabase(`/rest/v1/${TYPES[input.type].table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: input.status, updated_at: new Date().toISOString() }),
      });
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) throw new HttpError(404, 'Record not found.');
      return json(200, { ok: true });
    }

    if (action === 'delete') {
      if (event.httpMethod !== 'POST') throw new HttpError(405, 'Method not allowed.');
      const input = parseBody(event);
      if (!['questions', 'videos', 'chat'].includes(input.type)) throw new HttpError(400, 'Invalid record type.');
      const id = text(input.id || '', 'record ID', 80, true);
      const table = TYPES[input.type].table;
      const rows = await getRow(table, `select=id${input.type === 'videos' ? ',storage_path' : ''}&id=eq.${encodeURIComponent(id)}&limit=1`);
      if (!rows.length) throw new HttpError(404, 'Record not found.');
      if (input.type === 'videos') {
        await storage(`/object/${BUCKET}`, {
          method: 'DELETE',
          body: JSON.stringify({ prefixes: [rows[0].storage_path] }),
        });
      }
      await supabase(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
      return json(200, { ok: true });
    }

    if (action === 'download') {
      if (event.httpMethod !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const id = text(new URLSearchParams(event.rawQuery || '').get('id') || '', 'record ID', 80, true);
      const rows = await getRow('videos', `select=storage_path,original_name&id=eq.${encodeURIComponent(id)}&limit=1`);
      if (!rows.length) throw new HttpError(404, 'Video not found.');
      const path = rows[0].storage_path;
      if (typeof path !== 'string' || !/^[a-f0-9-]{36}\.[a-z0-9]{2,8}$/i.test(path)) throw new HttpError(404, 'Video not found.');
      const { data } = await storage(`/object/sign/${BUCKET}/${encodeURIComponent(path)}`, {
        method: 'POST',
        body: JSON.stringify({ expiresIn: 120 }),
      });
      const signed = data?.signedURL || data?.signedUrl || data?.url;
      if (typeof signed !== 'string') throw new HttpError(503, 'Could not create a secure video link.');
      const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
      return json(200, { ok: true, url: new URL(signed, `${base}/storage/v1/`).href, name: rows[0].original_name });
    }

    throw new HttpError(404, 'Unknown admin action.');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(status, { ok: false, error: safeMessage(error) });
  }
}

export default legacyHandler(handler);
