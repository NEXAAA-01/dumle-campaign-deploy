const assert = require('node:assert/strict');
const test = require('node:test');
const { answer, detectLanguage } = require('../public/chat-responses.js');

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
  assert.match(answer(question, 'Pidgin'), /raise living standards, create jobs, and support our people/);
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
