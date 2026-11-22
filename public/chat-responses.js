(function (root, factory) {
  var responses = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = responses;
  root.DumleChatResponses = responses;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var PIDGIN_HINT = /\b(?:how far|how you dey|how body|how things? dey|wetin|watin|abeg|wahala|pikin|chop|una|sabi|wida|abobi|manchi|manci|manchester wida|no be|dey|wey|naija|guyman|oboy)\b/i;
  var IGBO_HINT = /\b(?:kedu|ndewo|nnoo|biko|daalu|imela|anyi|nwanne|chukwu|obodo|juo)\b|oru|ahuike|agumakwukwo|ulo ogwu/i;
  var HAUSA_HINT = /\b(?:sannu|ina kwana|barka|lafiya|yaya|nagode|na gode|gwamnati|aiki|tsaro|tambaya|aboki|yankin|yunwa)\b/i;
  var YORUBA_HINT = /\b(?:bawo|kaabo|e ku|e kaaro|e kaasan|e n le|jowo|ijoba|kilode|mo fe|oluwa|awon|se o|omo mi|pele)\b|ise|ilera|eko|aabo|ina|ijo/i;
  var GREETING = /^\s*(?:hi|hello|hey|good morning|good afternoon|good evening|how far|how you dey|how body|how things? dey|wetin dey|watin dey|manchester wida|manchi|manci|wida|abobi|guyman|oboy)\b/i;
  var FOOD = /\b(?:watin|wetin)\s+(?:we\s+)?(?:go\s+)?chop\b|\bwhat(?:\s+are|\s+do)?\s+we\s+eat\b|\bfood\b|\bhungry\b|\bhunger\b/i;
  var ROLE = /\b(?:who|role|speaker|assembly|representative|deputy speaker|public record)\b/i;
  var ACHIEVEMENTS = /\b(?:done|achievement|project|gokana|manifesto|agenda|record|bill|vote|legislat|completed)\b/i;
  var PRIORITIES = /\b(?:job|jobs|work|employment|living standard|food|chop|business|support|plan|agenda|rainbow coalition|economy|health|school|road)\b/i;
  var CONCERN = /\b(?:worry|concern|problem|suffer|struggle|fear|hardship|help|urgent|pain|bad|hunger|jobless|no job|unsafe|difficult|hard|road|water|light|school|hospital|security|clinic|transport)\b/i;

  var LOCAL_LANGUAGE_REVIEW = 'Replies in this language are waiting for fluent-speaker review so we do not give you a wrong translation. For now, please choose English, Pidgin, Igbo, Hausa or Yoruba, or send your question to the campaign team.';

  function fold(value) {
    try {
      return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (error) {
      return String(value || '').toLowerCase();
    }
  }

  function detectLanguage(question, selectedLanguage) {
    if (selectedLanguage && selectedLanguage !== 'English') return selectedLanguage;
    var text = fold(question);
    if (PIDGIN_HINT.test(text)) return 'Pidgin';
    if (IGBO_HINT.test(text)) return 'Igbo';
    if (HAUSA_HINT.test(text)) return 'Hausa';
    if (YORUBA_HINT.test(text)) return 'Yoruba';
    return 'English';
  }

  function pidginAnswer(text) {
    var s = text.toLowerCase();
    if (FOOD.test(s)) {
      return 'Plenty food dey, abobi! For Rainbow Coalition, our focus na to raise living standards, create jobs, and support our people. Which matter concern you pass?';
    }
    if (GREETING.test(s)) {
      return 'I dey, manchi! Abobi, how far? How things dey na? You wan ask me any question? Yarn am, make I give you better answer.';
    }
    if (ROLE.test(s)) {
      return 'I hear you, my person. Public records list Rt. Hon. Dumle Maol as Deputy Speaker of the Rivers State House of Assembly for Gokana. You fit check the official Assembly profile for the latest public record.';
    }
    if (ACHIEVEMENTS.test(s)) {
      return 'I no wan give you wrong gist, my person. This site no get a verified list of completed constituency projects or a full manifesto to confirm yet. Send the question to the campaign team and dem fit check am for you.';
    }
    if (CONCERN.test(s)) {
      return 'I hear you well, my person. E no easy when something dey affect you or your community. Your voice matter. Tell me your community and wetin dey happen, make I share wetin I fit confirm and help the team follow up.';
    }
    if (PRIORITIES.test(s)) {
      return 'For Rainbow Coalition, our focus na to raise living standards, create jobs, and support our people. Tell me which matter touch you or your community most, make I answer you well.';
    }
    return 'I dey hear you, my person. I no wan guess or give you wrong gist. Ask me about Dumle Maol public role, the campaign focus, or send your question to the campaign team for follow-up.';
  }

  function igboAnswer(text) {
    var s = fold(text);
    if (GREETING.test(s) || /\b(?:kedu|ndewo|nnoo)\b/i.test(s)) {
      return 'Nnọọ, enyi m! Kedu ka ị mere? Kedu ajụjụ ị chọrọ ịjụ m taa?';
    }
    if (ROLE.test(s) || /\b(?:onye bu|mataimakin|ulo nzuko|ndi ome iwu)\b/i.test(s)) {
      return 'Akwụkwọ ndekọ ọha na-egosi na Rt. Hon. Dumle Maol bụ Osote Ọkà Okwu nke Ụlọ Nzukọ Ndị Ome Iwu nke Rivers State, na-anọchite anya Gokana. Maka ozi kacha ọhụrụ, lelee profaịlụ Assembly gọọmenti.';
    }
    if (ACHIEVEMENTS.test(s) || /\b(?:emere|rụrụ|ruru|ngozi|ulo oru)\b/i.test(s)) {
      return 'Achọtaghị m ozi a n’akwụkwọ ndekọ anyị kwadoro, ya mere agaghị m echepụta azịza. Biko ziga ajụjụ gị n’aka ndị otu kampeni ka ha nyochaa ya.';
    }
    if (CONCERN.test(s) || /\b(?:nsogbu|nchegbu|aguu)\b/i.test(s)) {
      return 'Anụrụ m ihe na-echegbu gị, enyi m. Daalụ maka ịkọrọ m ya. Ihe na-eme n’obodo gị dị mkpa. Biko gwa m obodo gị na ihe ị chọrọ ka ndị otu kampeni lebara anya.';
    }
    if (PRIORITIES.test(s) || /\b(?:oru|oru|ahuike|agumakwukwo|ulo ogwu|ulo akwukwo|nri|azu ahia)\b/i.test(s)) {
      return 'Maka Rainbow Coalition, ihe anyị lekwasịrị anya bụ ime ka ndụ ndị mmadụ ka mma, ịmepụta ọrụ, na ịkwado ndị anyị. Kedu ihe kacha mkpa nye gị ma ọ bụ obodo gị?';
    }
    return 'Daalụ maka ịjụ. Ọ bụrụ na enweghị m ozi e kwadoro, agaghị m echepụta azịza. Biko kọwaa ajụjụ gị ma ọ bụ ziga ya n’aka ndị otu kampeni.';
  }

  function hausaAnswer(text) {
    var s = fold(text);
    if (GREETING.test(s) || /\b(?:sannu|ina kwana|barka|lafiya|yaya dai)\b/i.test(s)) {
      return 'Sannu abokina! Yaya kake? Wace tambaya kake son yi min yau?';
    }
    if (ROLE.test(s) || /\b(?:waye|mataimakin shugaban|majalisar)\b/i.test(s)) {
      return 'Bayanan jama’a sun nuna Rt. Hon. Dumle Maol a matsayin Mataimakin Shugaban Majalisar Dokokin Jihar Rivers, mai wakiltar Gokana. Don sabon bayani, duba shafin Majalisar.';
    }
    if (ACHIEVEMENTS.test(s) || /\b(?:nasara|aikin da aka yi|aikata|manufa)\b/i.test(s)) {
      return 'Ban sami wannan bayani a cikin bayanan da aka tabbatar ba, don haka ba zan kirkiri amsa ba. Aiko da tambayarka ga tawagar yakin neman zabe domin su duba.';
    }
    if (CONCERN.test(s) || /\b(?:damuwa|matsala|talauci|yunwa|wahala|fargaba)\b/i.test(s)) {
      return 'Na fahimci damuwarka, abokina. Na gode da ka gaya min. Abin da ke faruwa a yankinku yana da muhimmanci. Ka fada min garinku da abin da kake bukatar tawagar ta duba.';
    }
    if (PRIORITIES.test(s) || /\b(?:aiki|rayuwa|abinci|kasuwanci|tallafa|makaranta|asibiti|hanyar)\b/i.test(s)) {
      return 'Ga Rainbow Coalition, abin da muka fi mayar da hankali a kai shi ne inganta rayuwar jama’a, samar da ayyukan yi, da tallafa wa al’ummarmu. Wane batu ne ya fi muhimmanci a gare ka ko yankinku?';
    }
    return 'Na gode da tambayarka. Idan babu ingantaccen bayani a gare ni, ba zan kirkiri amsa ba. Ka fayyace tambayarka ko aika ta ga tawagar yakin neman zabe.';
  }

  function yorubaAnswer(text) {
    var s = fold(text);
    if (GREETING.test(s) || /\b(?:bawo|kaabo|e kaaro|e kaasan|e ku)\b/i.test(s)) {
      return 'Ẹ káàbọ̀, ọ̀rẹ́ mi! Báwo ni? Ìbéèrè wo lo fẹ́ bi mi lónìí?';
    }
    if (ROLE.test(s) || /\b(?:agbajo|asoju|olori|ile igbimo|soju)\b/i.test(s)) {
      return 'Àkọsílẹ̀ gbangba sọ pé Rt. Hon. Dumle Maol ni Igbákejì Agbọrọsọ Ilé Igbìmọ̀ Aṣòfin Ìpínlẹ̀ Rivers, tó ń ṣojú Gokana. Fún àlàyé tuntun, wo ojú-òpó Ilé Igbìmọ̀ náà.';
    }
    if (ACHIEVEMENTS.test(s) || /\b(?:ise akanse|ohun ti a se|eto ti a gbe jade|aṣeyọri)\b/i.test(s)) {
      return 'Mi ò rí ìdáhùn sí èyí nínú ètò tàbí àkọsílẹ̀ tí a fọwọ́ sí, nítorí náà mi ò ní dá ìdáhùn sílẹ̀. Jọ̀wọ́ fi ìbéèrè rẹ ránṣẹ́ sí ẹgbẹ́ ìpolongo kí wọ́n lè ṣàyẹ̀wò rẹ.';
    }
    if (CONCERN.test(s) || /\b(?:isoro|ibanuje|iberu|osi|iyanju)\b/i.test(s)) {
      return 'Mo gbọ́ ohun tó ń ṣe ọ́ ní àníyàn, ọ̀rẹ́ mi. O ṣeun fún fífi èyí sọ fún mi. Ohun tó ń ṣẹlẹ̀ ní àdúgbò rẹ ṣe pàtàkì. Jọ̀wọ́ sọ ibi tí o wà àti ohun tí o fẹ́ kí ẹgbẹ́ ìpolongo ṣàyẹ̀wò.';
    }
    if (PRIORITIES.test(s) || /\b(?:ise|igbesi aye|ounje|owo|ona|omi|ile iwe|ile iwosan|aabo)\b/i.test(s)) {
      return 'Fún Rainbow Coalition, ohun tí a fẹ́ dojú kọ ni mímú ìgbésí-ayé àwọn ènìyàn sunwọ̀n síi, dídá iṣẹ́ sílẹ̀, àti ríran àwọn ènìyàn wa lọ́wọ́. Kí ni ọ̀rọ̀ tó ṣe pàtàkì jù lọ fún ìwọ tàbí àdúgbò rẹ?';
    }
    return 'O ṣeun fún ìbéèrè rẹ. Mi ò ní dá ìsọfúnni tí a kò fìdí rẹ̀ múlẹ̀ sílẹ̀. Jọ̀wọ́ ṣàlàyé ìbéèrè rẹ tàbí fi ránṣẹ́ sí ẹgbẹ́ ìpolongo.';
  }

  function answer(question, language) {
    var text = String(question || '').trim();
    var selected = language || detectLanguage(text, 'English');
    var lower = fold(text);
    if (selected === 'Pidgin') return pidginAnswer(text);
    if (selected === 'Igbo') return igboAnswer(text);
    if (selected === 'Hausa') return hausaAnswer(text);
    if (selected === 'Yoruba') return yorubaAnswer(text);
    if (selected === 'Gokana' || selected === 'Khana' || selected === 'Eleme') {
      return selected + ' ' + LOCAL_LANGUAGE_REVIEW;
    }

    var opening = CONCERN.test(lower)
      ? 'I hear the concern in your question, and I appreciate you telling me. What is happening in your community matters. '
      : 'Thank you for reaching out. Your question matters. ';
    if (GREETING.test(lower)) {
      return 'Hello, my friend. I’m here with you. What would you like to ask me today?';
    }
    if (ROLE.test(lower)) {
      return opening + 'Public records list Rt. Hon. Dumle Maol as Deputy Speaker of the Rivers State House of Assembly for Gokana. See the official Assembly profile for the latest public record.';
    }
    if (ACHIEVEMENTS.test(lower)) {
      return opening + 'I do not have a verified list of completed constituency projects or a full manifesto to confirm here. Please send your question to the campaign team so they can check the public record.';
    }
    if (FOOD.test(lower) || PRIORITIES.test(lower)) {
      return opening + 'For the Rainbow Coalition, our focus is raising living standards, creating jobs, and supporting our people. Which issue matters most to you or your community?';
    }
    if (CONCERN.test(lower)) {
      return opening + 'Tell me your community and what you would like the campaign team to look into. I will share what I can confirm and avoid guessing.';
    }
    return opening + 'I will share what is in the public record; where I do not have verified information, I will not guess. You can also send your question to the campaign team for follow-up.';
  }

  return { answer: answer, detectLanguage: detectLanguage };
});
