import {
  assertPublicRequest, HttpError, insertRow, json, legacyHandler, parseBody, rateLimit, safeMessage, text, verifyFormToken,
} from './common.mjs';

async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
  try {
    assertPublicRequest(event);
    const input = parseBody(event);
    verifyFormToken(input.token);
    const session = text(input.session || '', 'session', 80, true);
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(session)) throw new HttpError(400, 'Invalid session.');
    const question = text(input.question, 'question', 400, true);
    const answer = text(input.answer, 'answer', 20000, true);
    const sources = text(input.sources || '', 'sources', 250);
    const channel = input.channel || 'text';
    if (!['text', 'voice'].includes(channel)) throw new HttpError(400, 'Invalid channel.');
    await rateLimit(event, 'chat', 120, 3600);
    await insertRow('chat_logs', { session_id: session, question, answer, sources, channel });
    return json(201, { ok: true });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(status, { ok: false, error: safeMessage(error) });
  }
}

export default legacyHandler(handler);
