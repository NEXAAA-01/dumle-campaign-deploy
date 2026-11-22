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
  var IDENTITY = /\b(?:are you (?:(?:a|an) )?(?:real|human|bot|ai|robot|machine|person)|is this (?:really )?(?:you|real)|who (?:are you|is typing|is answering|is replying)|who types|na you|wetin be your name)\b/i;
  var MANIFESTO = /\b(?:apc|renewed hope|manifesto|agenda|party plan|policy|policies)\b/i;
  var ROLE = /\b(?:who|role|speaker|assembly|representative|represent|deputy speaker|public record)\b/i;
  var ACHIEVEMENTS = /\b(?:done|achievement|project|record|bill|vote|legislat|completed|built|delivered)\b/i;
  var PRIORITIES = /\b(?:job|jobs|work|employment|living standard|food|chop|business|economy|health|school|education|road|security|agriculture|farming|power|transport|youth|light|water)\b/i;
  var CONCERN = /\b(?:worry|concern|problem|suffer|struggle|fear|hardship|help|urgent|pain|bad|hunger|jobless|no job|unsafe|difficult|hard|road|water|light|school|hospital|security|clinic|transport)\b/i;
  var LOCAL_LANGUAGE_REVIEW = 'Replies in this language are waiting for fluent-speaker review so we do not give you a wrong translation. For now, please choose English, Pidgin, Igbo, Hausa or Yoruba, or send your question to the campaign team.';
  function fold(value) {
    try { return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    catch (error) { return String(value || '').toLowerCase(); }
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
    var s = fold(text);
    if (IDENTITY.test(s) || /\b(?:who dey type|wetin be your name)\b/i.test(s)) return 'Make I tell you straight, my person: I be the campaign chat assistant, no be Dumle Maol himself. I answer in his campaign voice from public records and APC policy sources, and the team fit follow up through the message form.';
    if (FOOD.test(s)) return 'Plenty food dey, abobi! I want farmers to grow, store and move more food, so families fit benefit. APC Renewed Hope national plan includes agriculture, food security and jobs. Tell me wetin your community need pass.';
    if (GREETING.test(s)) return 'I dey, manchi! Abobi, how far? How things dey for your side? Wetin you wan ask me today? Yarn me, I dey listen.';
    if (MANIFESTO.test(s)) return 'I fit point you to APC Renewed Hope 2023 national plan. E cover security, jobs and economy, farming and food, power, transport, school, health, digital economy and youth opportunity. Na national party plan, no be proof say project don happen for Gokana. My Assembly role na to represent you, take part in lawmaking and oversight. Which matter dey affect your community pass?';
    if (ROLE.test(s)) return 'I serve as Deputy Speaker of the Rivers State House of Assembly and represent Gokana. My official House profile describes my role in House proceedings and legislative oversight. Your voice matter to me; tell me what you want the House to hear.';
    if (ACHIEVEMENTS.test(s)) return 'I hear you, my person. I represent Gokana as Deputy Speaker, but my official House profile no publish item-by-item list of completed constituency projects. Your community deserve clear facts, so tell me the project or area you mean and I fit help check the public record.';
    if (CONCERN.test(s)) return 'Ah, my person, I hear you. E no easy when this kind matter dey affect your home or community. Your voice matter to me. Tell me where e dey happen and wetin you need, make I share the public information and help the team follow up.';
    if (PRIORITIES.test(s)) return 'I want our people to feel progress in everyday life. APC Renewed Hope national plan covers jobs, farming, power, transport, education, health and security. My role na to represent you and take part in lawmaking and oversight. Which one matter to your community pass?';
    return 'I dey hear you, my person, and I glad say you reach out. I fit tell you about my public role, APC Renewed Hope priorities, or the information on Gokana and Rivers. Wetin dey your mind?';
  }
  function igboAnswer(text) {
    var s = fold(text);
    if (IDENTITY.test(s)) return 'Ka m gwa gị eziokwu: abụ m onye enyemaka nkata nke kampeni, ọ bụghị Rt. Hon. Dumle Maol n’onwe ya. Ana m aza n’olu kampeni site na ndekọ ọha na amụma APC e bipụtara.';
    if (GREETING.test(s) || /\b(?:kedu|ndewo|nnoo)\b/i.test(s)) return 'Nnọọ, enyi m! Obi dị m ụtọ na ị bịara. Kedu ka ị mere? Kedu ajụjụ ị chọrọ ịjụ m taa?';
    if (FOOD.test(s) || /\b(?:nri|aguu)\b/i.test(s)) return 'Amaara m na nri na ndụ ezinụlọ dị ezigbo mkpa. Atụmatụ mba APC Renewed Hope kwuru maka ọrụ ugbo, nchekwa nri na ọrụ. Achọrọ m ka ndị ọrụ ugbo nwee ohere ka mma ịzụlite na ibuga ihe ubi. Kedu ihe kacha mkpa n’obodo gị?';
    if (MANIFESTO.test(s)) return 'Enwere m ike igosi gị atụmatụ mba APC Renewed Hope nke 2023. Ọ gụnyere nchekwa, akụ na ụba na ọrụ, ọrụ ugbo, ọkụ eletrik, njem, agụmakwụkwọ, ahụike, teknụzụ dijitalụ na ohere maka ndị ntorobịa. Nke a bụ atụmatụ otu ndọrọ ndọrọ ọchịchị maka mba, ọ bụghị ndepụta ọrụ Gokana emechara. Dị ka Osote Ọkà Okwu, ana m eje ozi site n’ịnọchite anya ndị mmadụ, iwu na nlekọta. Kedu ihe kacha emetụta obodo gị?';
    if (ROLE.test(s) || /\b(?:onye bu|mataimakin|ulo nzuko|ndi ome iwu)\b/i.test(s)) return 'Ana m eje ozi dị ka Osote Ọkà Okwu nke Ụlọ Nzukọ Ndị Ome Iwu Rivers State, ana m anọchitekwa anya Gokana. Profaịlụ gọọmenti m na-akọwa ọrụ m n’usoro nzukọ ụlọ ome iwu na nlekọta iwu. Echiche gị dị m mkpa; gwa m ihe ị chọrọ ka ndị ome iwu nụ.';
    if (ACHIEVEMENTS.test(s) || /\b(?:emere|rụrụ|ruru|ngozi|ulo oru)\b/i.test(s)) return 'Ana m anọchite anya Gokana dị ka Osote Ọkà Okwu, mana profaịlụ gọọmenti m edepụtaghị ọrụ obodo niile e mechara n’otu n’otu. Ndị obodo gị kwesịrị ịnata eziokwu doro anya. Kọwaa ọrụ ma ọ bụ ebe ị na-ekwu maka ya, ka m nyere aka lelee ndekọ ọha.';
    if (CONCERN.test(s) || /\b(?:nsogbu|nchegbu|aguu)\b/i.test(s)) return 'Anụrụ m gị, enyi m, obi dịkwa m ụtọ na ị gwara m. Ihe na-eme n’obodo gị dị m mkpa. Gwa m ebe ị nọ na ihe ị chọrọ ka ndị otu kampeni leba anya.';
    if (PRIORITIES.test(s) || /\b(?:oru|ahuike|agumakwukwo|ulo ogwu|ulo akwukwo|azu ahia)\b/i.test(s)) return 'Achọrọ m ka ndị mmadụ hụ mgbanwe n’ọrụ, ọrụ ugbo, ọkụ eletrik, njem, agụmakwụkwọ, ahụike na nchekwa. Ndị a so n’ihe APC kwuru n’atụmatụ Renewed Hope nke mba. Dị ka onye ome iwu, ana m anọchite anya gị ma na-esonye n’iwu na nlekọta. Kedu ihe kacha mkpa n’obodo gị?';
    return 'Ana m ekele gị maka ịjụ m. Obi dị m ụtọ ịnụ olu gị. Enwere m ike inyere gị aka gbasara ọrụ m, atụmatụ APC Renewed Hope, ma ọ bụ ihe na-eme na Gokana na Rivers. Kedu ihe dị gị n’obi?';
  }
  function hausaAnswer(text) {
    var s = fold(text);
    if (IDENTITY.test(s)) return 'Bari in fada maka gaskiya: ni mataimakin tattaunawar kamfen ne, ba Rt. Hon. Dumle Maol da kansa ba. Ina amsawa cikin salon kamfen bisa bayanan jama’a da manufofin APC da aka wallafa.';
    if (GREETING.test(s) || /\b(?:sannu|ina kwana|barka|lafiya|yaya dai)\b/i.test(s)) return 'Sannu abokina! Na yi farin ciki da ka zo. Yaya kake? Wace tambaya kake son yi min yau?';
    if (FOOD.test(s) || /\b(?:abinci|yunwa)\b/i.test(s)) return 'Na san abinci da rayuwar iyali suna da muhimmanci sosai. Shirin APC Renewed Hope na kasa ya kunshi noma, wadatar abinci da ayyukan yi. Ina son manoma su samu damar noma, adanawa da kai amfanin gona kasuwa. Wane bukata ce ta fi damun yankinku?';
    if (MANIFESTO.test(s)) return 'Zan iya nuna maka shirin APC Renewed Hope na 2023 na kasa. Ya kunshi tsaro, tattalin arziki da ayyukan yi, noma, wutar lantarki, sufuri, ilimi, lafiya, fasahar dijital da damar matasa. Wannan shirin jam’iyya ne na kasa, ba jerin ayyukan Gokana da aka kammala ba. A matsayina na Mataimakin Shugaban Majalisa, ina wakiltar jama’a, shiga aikin dokoki da sa ido. Wane batu ne ya fi shafar yankinku?';
    if (ROLE.test(s) || /\b(?:waye|mataimakin shugaban|majalisar)\b/i.test(s)) return 'Ina aiki a matsayin Mataimakin Shugaban Majalisar Dokokin Jihar Rivers, ina wakiltar Gokana. Shafin Majalisa na hukuma ya bayyana rawar da nake takawa a zaman majalisa da sa ido kan dokoki. Muryarku tana da muhimmanci a gare ni; gaya mini abin da kuke son Majalisa ta ji.';
    if (ACHIEVEMENTS.test(s) || /\b(?:nasara|aikin da aka yi|aikata|manufa)\b/i.test(s)) return 'Ina wakiltar Gokana a matsayin Mataimakin Shugaban Majalisa, amma shafina na hukuma bai wallafa cikakken jerin ayyukan da aka kammala daya bayan daya ba. Al’ummarku ta cancanci bayani bayyananne. Ka fada mini aikin ko yankin da kake nufi, in taimaka wajen duba bayanan jama’a.';
    if (CONCERN.test(s) || /\b(?:damuwa|matsala|talauci|yunwa|wahala|fargaba)\b/i.test(s)) return 'Na ji damuwarka, abokina, kuma na gode da ka gaya min. Abin da ke faruwa a yankinku yana da muhimmanci a gare ni. Ka fada mini garinku da abin da kake bukatar tawagar ta duba.';
    if (PRIORITIES.test(s) || /\b(?:aiki|rayuwa|abinci|kasuwanci|tallafa|makaranta|asibiti|hanyar)\b/i.test(s)) return 'Ina son mutane su ga ci gaba a ayyukan yi, noma, wutar lantarki, sufuri, ilimi, lafiya da tsaro. Wadannan suna cikin manyan batutuwan shirin APC Renewed Hope na kasa. A matsayina na dan majalisa, ina wakiltarku kuma ina shiga aikin dokoki da sa ido. Wane batu ne ya fi muhimmanci a yankinku?';
    return 'Na gode da ka tuntube ni. Ina farin cikin jin muryarka. Zan iya taimaka maka game da aikina, shirin APC Renewed Hope, ko abin da ke faruwa a Gokana da Rivers. Me ke ranka?';
  }
  function yorubaAnswer(text) {
    var s = fold(text);
    if (IDENTITY.test(s)) return 'Jẹ́ kí n sọ òtítọ́: olùrànlọ́wọ́ ìjíròrò ẹgbẹ́ ìpolongo ni mí, kì í ṣe Rt. Hon. Dumle Maol fúnra rẹ̀. Mo ń dáhùn ní ohùn ìpolongo láti inú àkọsílẹ̀ gbangba àti ìlànà APC tí a tẹ̀ jáde.';
    if (GREETING.test(s) || /\b(?:bawo|kaabo|e kaaro|e kaasan|e ku)\b/i.test(s)) return 'Ẹ káàbọ̀, ọ̀rẹ́ mi! Inú mi dùn pé o wà níbí. Báwo ni? Ìbéèrè wo lo fẹ́ bi mí lónìí?';
    if (FOOD.test(s) || /\b(?:ounje|ebi)\b/i.test(s)) return 'Mo mọ̀ pé oúnjẹ àti ìgbésí-ayé ẹbí ṣe pàtàkì gan-an. Ètò APC Renewed Hope ti orílẹ̀-èdè ní àwọn ètò nípa iṣẹ́ àgbẹ̀, ààbò oúnjẹ àti iṣẹ́. Mo fẹ́ kí àwọn àgbẹ̀ lè gbin, tọ́jú, kí wọ́n sì gbé ọjà wọn dé ọjà. Kí ni àdúgbò yín nílò jù?';
    if (MANIFESTO.test(s)) return 'Mo lè tọ́ka sí ètò APC Renewed Hope ti ọdún 2023 fún orílẹ̀-èdè. Ó ní ààbò, ọrọ̀-ajé àti iṣẹ́, iṣẹ́ àgbẹ̀, iná mànàmáná, ìrìnàjò, ẹ̀kọ́, ìlera, ìmọ̀ ẹ̀rọ ayélujára àti àǹfààní fún ọ̀dọ́. Ètò ẹgbẹ́ fún gbogbo orílẹ̀-èdè ni; kì í ṣe àtòjọ iṣẹ́ Gokana tí a ti parí. Gẹ́gẹ́ bí Igbákejì Agbọrọsọ, mo ń ṣojú yín, mo sì ń kópa nínú ìlànà àti àbójútó Ilé Igbìmọ̀. Ọ̀ràn wo ló kan àdúgbò yín jù?';
    if (ROLE.test(s) || /\b(?:agbajo|asoju|olori|ile igbimo|soju)\b/i.test(s)) return 'Mo ń ṣiṣẹ́ gẹ́gẹ́ bí Igbákejì Agbọrọsọ Ilé Igbìmọ̀ Aṣòfin Ìpínlẹ̀ Rivers, mo sì ń ṣojú Gokana. Ojú-òpó Ilé Igbìmọ̀ sọ nípa ipa mi nínú ìpàdé àti àbójútó òfin. Ohùn yín ṣe pàtàkì sí mi; sọ ohun tí ẹ fẹ́ kí Ilé Igbìmọ̀ gbọ́.';
    if (ACHIEVEMENTS.test(s) || /\b(?:ise akanse|ohun ti a se|eto ti a gbe jade|aṣeyọri)\b/i.test(s)) return 'Mo ń ṣojú Gokana gẹ́gẹ́ bí Igbákejì Agbọrọsọ, ṣùgbọ́n ojú-òpó Ilé Igbìmọ̀ mi kò ṣe àtòjọ gbogbo iṣẹ́ àdúgbò tí a parí lọ́kọ̀ọ̀kan. Àdúgbò yín yẹ fún ìdáhùn tó ṣe kedere. Sọ iṣẹ́ tàbí agbègbè tí o túmọ̀ sí, kí n lè ràn ọ́ lọ́wọ́ láti ṣàyẹ̀wò àkọsílẹ̀ gbangba.';
    if (CONCERN.test(s) || /\b(?:isoro|ibanuje|iberu|osi|iyanju)\b/i.test(s)) return 'Mo gbọ́ ohun tó ń ṣe ọ́ ní àníyàn, ọ̀rẹ́ mi, mo sì dúpẹ́ pé o sọ fún mi. Ohun tó ń ṣẹlẹ̀ ní àdúgbò rẹ ṣe pàtàkì sí mi. Jọ̀wọ́ sọ ibi tí o wà àti ohun tí o fẹ́ kí ẹgbẹ́ ìpolongo ṣàyẹ̀wò.';
    if (PRIORITIES.test(s) || /\b(?:ise|igbesi aye|ounje|owo|ona|omi|ile iwe|ile iwosan|aabo)\b/i.test(s)) return 'Mo fẹ́ kí àwọn ènìyàn rí ìlọsíwájú nínú iṣẹ́, iṣẹ́ àgbẹ̀, iná mànàmáná, ìrìnàjò, ẹ̀kọ́, ìlera àti ààbò. Àwọn wọ̀nyí wà lára àwọn àkòrí ètò APC Renewed Hope fún orílẹ̀-èdè. Gẹ́gẹ́ bí aṣòfin, mo ń ṣojú yín, mo sì ń kópa nínú ìlànà àti àbójútó. Èwo ló ṣe pàtàkì jù fún àdúgbò yín?';
    return 'Mo dúpẹ́ pé o kàn sí mi. Inú mi dùn láti gbọ́ ohùn rẹ. Mo lè ràn ọ́ lọ́wọ́ nípa iṣẹ́ mi, ètò APC Renewed Hope, tàbí ohun tó ń ṣẹlẹ̀ ní Gokana àti Rivers. Kí ni ó wà lọ́kàn rẹ?';
  }
  function answer(question, language) {
    var text = String(question || '').trim();
    var selected = language || detectLanguage(text, 'English');
    var lower = fold(text);
    if (IDENTITY.test(lower) || /\b(?:who dey type|wetin be your name)\b/i.test(lower)) {
      if (selected === 'Pidgin') return pidginAnswer(text);
      if (selected === 'Igbo') return igboAnswer(text);
      if (selected === 'Hausa') return hausaAnswer(text);
      if (selected === 'Yoruba') return yorubaAnswer(text);
      return 'I’m the campaign’s chat assistant, not Dumle Maol himself. I reply in first-person style using the Deputy Speaker’s public record and APC’s published policy, and I can pass a follow-up to the campaign team.';
    }
    if (selected === 'Pidgin') return pidginAnswer(text);
    if (selected === 'Igbo') return igboAnswer(text);
    if (selected === 'Hausa') return hausaAnswer(text);
    if (selected === 'Yoruba') return yorubaAnswer(text);
    if (selected === 'Gokana' || selected === 'Khana' || selected === 'Eleme') return selected + ' ' + LOCAL_LANGUAGE_REVIEW;
    var opening = CONCERN.test(lower)
      ? 'I hear how much this matters to you, and I appreciate you trusting me with it. '
      : 'I’m glad you reached out, and I’m listening. ';
    if (GREETING.test(lower)) return 'Hello, my friend. I’m here with you, and I’m glad you stopped by. What would you like to ask me today?';
    if (FOOD.test(lower)) return opening + 'Food security matters to every family. I can point you to the APC Renewed Hope national plan, which includes agriculture and food security; it is a national party plan, not a list of completed Gokana projects. What food or farming issue is affecting your community?';
    if (MANIFESTO.test(lower)) return opening + 'I can point you to APC’s 2023 Renewed Hope national plan. It covers security, economic growth and jobs, agriculture, power, transport, education, healthcare, the digital economy and youth opportunity. I treat that as a national party platform, not a Gokana project list. As Deputy Speaker, I serve through representation, lawmaking and oversight. Which priority matters most to your community?';
    if (ROLE.test(lower)) return opening + 'I serve as Deputy Speaker of the Rivers State House of Assembly and represent Gokana. My official House profile describes my role in House proceedings and legislative oversight. Your voice matters to me; what would you like the House to hear?';
    if (ACHIEVEMENTS.test(lower)) return opening + 'I represent Gokana as Deputy Speaker, but my official House profile does not publish an itemized list of completed constituency projects. Your community deserves clear facts. Tell me the project or place you mean, and I can help check what the public record says.';
    if (CONCERN.test(lower)) return opening + 'Tell me your community and what you would like the team to look into. I want your concern to be heard, and I’ll share what I can confirm from the public record.';
    if (PRIORITIES.test(lower)) return opening + 'I want progress to reach people through better jobs, farming, power, transport, education, healthcare and security. Those are among the priorities in APC’s national Renewed Hope plan. My Assembly role is to represent you, take part in lawmaking and provide oversight. Which issue is most important where you live?';
    return opening + 'I can help with my public role, the Assembly record, APC’s national Renewed Hope priorities, or a concern in Gokana and Rivers. What is on your mind?';
  }
  return { answer: answer, detectLanguage: detectLanguage };
});
