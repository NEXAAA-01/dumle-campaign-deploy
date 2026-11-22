import {
  assertPublicRequest, HttpError, insertRow, json, legacyHandler, parseBody,
  rateLimit, safeMessage, text, verifyFormToken,
} from './common.mjs';

const LGAS = new Set([
  'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru',
  'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana',
  'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma',
  'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai',
]);

async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
  try {
    assertPublicRequest(event);
    const input = parseBody(event);
    verifyFormToken(input.token);
    if (text(input.homepage || '', 'website', 200)) return json(200, { ok: true });

    const name = text(input.name || '', 'name', 120);
    const contact = text(input.contact || '', 'contact', 120);
    const website = text(input.website || '', 'website', 200);
    const lga = text(input.lga || '', 'LGA', 80, true);
    const question = text(input.question, 'question', 600, true);
    if (!LGAS.has(lga)) throw new HttpError(400, 'Please choose a valid LGA.');
    await rateLimit(event, 'question', 8, 3600);
    await insertRow('questions', { name, contact, website, lga, question, status: 'new' });
    return json(201, { ok: true });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(status, { ok: false, error: safeMessage(error) });
  }
}

export default legacyHandler(handler);
