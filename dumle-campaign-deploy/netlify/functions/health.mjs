import { json, legacyHandler, supabase } from './common.mjs';

async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET' });
  }

  try {
    await supabase('/rest/v1/campaign_admins?select=user_id&limit=1');
    return json(200, { ok: true });
  } catch (error) {
    console.error('Campaign health check failed.', error);
    return json(503, { ok: false, error: 'Campaign services are not configured yet.' });
  }
}

export default legacyHandler(handler);
