import { assertPublicRequest, json, legacyHandler, rateLimit, issueFormToken, safeMessage, HttpError } from './common.mjs';

async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET' });
  try {
    assertPublicRequest(event);
    await rateLimit(event, 'token', 60, 600);
    return json(200, { ok: true, t: issueFormToken() });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(status, { ok: false, error: safeMessage(error) });
  }
}

export default legacyHandler(handler);
