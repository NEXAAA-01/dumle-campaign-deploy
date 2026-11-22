const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { answer, detectLanguage } = require('../public/chat-responses.js');

test('offers only languages with ready replies', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const languageSelect = html.match(/<select id="language"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(languageSelect);
  const options = [...languageSelect[1].matchAll(/<option value="([^"]+)">/g)].map(([, value]) => value);
  assert.deepEqual(options, ['English', 'Pidgin', 'Igbo', 'Hausa', 'Yoruba']);
});

test('detects Pidgin greetings and answers warmly', () => {
  for (const greeting of ['How far', 'Manchester wida', 'Manci', 'Abobi']) {
    const language = detectLanguage(greeting, 'English');
    assert.equal(language, 'Pidgin');
    assert.match(answer(greeting, language), /I dey, manchi!/);
  }
});

test('answers the Pidgin food-and-wellbeing question with the campaign focus', () => {
  const question = 'How far, watin we go chop na?';
  assert.match(answer(question, detectLanguage(question, 'English')), /Plenty food dey/);
  assert.match(answer(question, 'Pidgin'), /APC Renewed Hope national plan includes agriculture, food security and jobs/);
});

test('answers in first person and separates party policy from local public record', () => {
  const manifesto = answer('What does the APC manifesto say?', 'English');
  assert.match(manifesto, /I can point you to APC’s 2023 Renewed Hope national plan/);
  assert.match(manifesto, /not a Gokana project list/);

  const record = answer('What has been done for Gokana?', 'English');
  assert.match(record, /I represent Gokana as Deputy Speaker/);
  assert.match(record, /does not publish an itemized list of completed constituency projects/);
  assert.doesNotMatch(record, /I do not have a verified list/i);
});

test('identifies the campaign assistant honestly when asked', () => {
  assert.match(answer('Are you an AI?', 'English'), /I’m the campaign’s chat assistant, not Dumle Maol himself/);
  assert.match(answer('Who dey type?', 'Pidgin'), /I be the campaign chat assistant, no be Dumle Maol himself/);
});

test('updates the chat copy and links the manifesto and public profile', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.match(html, /Get straight answers from the Deputy Speaker/);
  assert.match(html, /where your browser supports it\.<\/p>/);
  assert.doesNotMatch(html, /Automated answers are not personal messages/);
  assert.doesNotMatch(html, /data-question="Where can I see the manifesto\?"/);
  assert.match(html, /https:\/\/apc\.com\.ng\/img\/apc_renewed_hope\.pdf/);
  assert.match(html, /https:\/\/hoa\.rv\.gov\.ng\/deputy-speaker\.html/);
});

test('detects Igbo, Hausa and Yoruba and replies in the selected language', () => {
  assert.equal(detectLanguage('Kedu ka ị mere?', 'English'), 'Igbo');
  assert.match(answer('Kedu ka ị mere?', 'Igbo'), /Nnọọ, enyi m/);
  assert.equal(detectLanguage('Sannu, ya kake?', 'English'), 'Hausa');
  assert.match(answer('Sannu, ya kake?', 'Hausa'), /Sannu abokina/);
  assert.equal(detectLanguage('Bawo ni?', 'English'), 'Yoruba');
  assert.match(answer('Bawo ni?', 'Yoruba'), /Ẹ káàbọ̀, ọ̀rẹ́ mi/);
  assert.equal(detectLanguage('How far?', 'Igbo'), 'Igbo');
});

test('keeps Gokana, Khana and Eleme behind the review notice', () => {
  for (const language of ['Gokana', 'Khana', 'Eleme']) {
    const reply = answer('How are you?', language);
    assert.match(reply, /fluent-speaker review/);
    assert.match(reply, /Hausa or Yoruba/);
  }
});
