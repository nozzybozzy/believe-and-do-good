// Builds content/duas/*.md for the duas that come from the Qur'an.
//
// The Arabic (Uthmani) and the Saheeh International translation are pulled from
// the same APIs the site uses, so the text is never transcribed by hand.
// Titles, occasions, transliteration and the notes are authored here.
//
//   node scripts/build-duas.mjs
import fs from 'node:fs';
import path from 'node:path';

const QF = 'https://api.quran.com/api/v4';
const AQ = 'https://api.alquran.cloud/v1';
const OUT = path.join(process.cwd(), 'content', 'duas');

/** slug, ref "surah:from-to", title, occasion[], translit (optional), note */
const DUAS = [
  ['guidance-al-fatihah', '1:6-7', 'The prayer for the straight path', ['daily', 'guidance', 'salah'],
    'Ihdinā ṣ-ṣirāṭa l-mustaqīm, ṣirāṭa lladhīna anʿamta ʿalayhim, ghayri l-maghḍūbi ʿalayhim wa-lā ḍ-ḍāllīn.',
    'Recited at least seventeen times a day in the obligatory prayers. The one thing the Muslim is made to ask for more than anything else is not wealth or safety but direction — and the two failures named after it are knowing and not acting, and acting without knowing.'],

  ['accept-from-us', '2:127', 'Accept this from us', ['work', 'worship', 'sincerity'],
    'Rabbanā taqabbal minnā, innaka anta s-samīʿu l-ʿalīm.',
    'Ibrahim and Ismail said this while laying the foundations of the Ka\'bah. They were building the House of Allah by His command and still asked for it to be accepted. No deed is safe on its own merits.'],

  ['make-us-submissive', '2:128', 'Make us submissive to You', ['family', 'children', 'repentance'],
    'Rabbanā wa-jʿalnā muslimayni laka wa-min dhurriyyatinā ummatan muslimatan laka.',
    'The continuation of the same prayer at the Ka\'bah: first for themselves, then for their descendants. Ibrahim prays for a community he will never meet.'],

  ['good-in-both-worlds', '2:201', 'Good in this world and the next', ['daily', 'comprehensive', 'hajj'],
    'Rabbanā ātinā fi d-dunyā ḥasanatan wa-fi l-ākhirati ḥasanatan wa-qinā ʿadhāba n-nār.',
    'The dua the Prophet ﷺ made most often, and the one most repeated between the Yemeni corner and the Black Stone. It is deliberately unspecific: it asks for whatever good is good, in both places, and for protection from the one outcome that would make the rest meaningless.'],

  ['pour-patience-upon-us', '2:250', 'Pour patience upon us', ['hardship', 'patience', 'fear'],
    'Rabbanā afrigh ʿalaynā ṣabran wa-thabbit aqdāmanā wa-nṣurnā ʿala l-qawmi l-kāfirīn.',
    'Talut\'s small band said this facing Jalut\'s army. The verb is *afrigh* — pour it over us, the way water is poured over something. Patience is asked for as something sent down, not something summoned from within.'],

  ['closing-of-al-baqarah', '2:285-286', 'The closing verses of Al-Baqarah', ['night', 'protection', 'forgiveness', 'burden'],
    null,
    'Given to the Prophet ﷺ on the night of the Ascension, from a treasure beneath the Throne. Whoever recites these two verses at night, they will suffice him. The dua at the end is answered clause by clause — the report says that after each request, the answer came: *I have done so.*'],

  ['do-not-let-our-hearts-deviate', '3:8', 'Do not let our hearts deviate', ['steadfastness', 'guidance', 'heart'],
    'Rabbanā lā tuzigh qulūbanā baʿda idh hadaytanā wa-hab lanā min ladunka raḥmatan, innaka anta l-wahhāb.',
    'The prayer of those firmly grounded in knowledge. Notice what they are afraid of: not ignorance, but deviation *after* guidance. The Prophet ﷺ swore by the One who turns the hearts, and this is the dua that follows from that.'],

  ['owner-of-sovereignty', '3:26-27', 'Owner of all sovereignty', ['provision', 'hardship', 'tawhid'],
    null,
    'Recited when honour or provision seems to be in someone else\'s hands. The passage places every form of power — giving it and taking it away, honour and humiliation — in one place, and then says that all good is in His hand.'],

  ['good-offspring', '3:38', 'Grant me good offspring', ['children', 'family', 'dua-for-a-child'],
    'Rabbi hab lī min ladunka dhurriyyatan ṭayyibatan, innaka samīʿu d-duʿāʾ.',
    'Zakariya made this dua as an old man with a barren wife, standing in the prayer niche, immediately after seeing provision arrive for Maryam out of season. Seeing Allah\'s generosity to someone else made him ask for his own.'],

  ['we-believe-write-us-down', '3:53', 'Write us among the witnesses', ['faith', 'sincerity'],
    'Rabbanā āmannā bimā anzalta wa-ttabaʿna r-rasūla fa-ktubnā maʿa sh-shāhidīn.',
    'The disciples of Isa. Belief and following are stated together, and only then is the request made — to be recorded among those who bore witness.'],

  ['forgive-our-excess', '3:147', 'Forgive our sins and our excesses', ['hardship', 'forgiveness', 'steadfastness'],
    'Rabbana-ghfir lanā dhunūbanā wa-isrāfanā fī amrinā wa-thabbit aqdāmanā wa-nṣurnā ʿala l-qawmi l-kāfirīn.',
    'The prayer of the godly men who fought alongside prophets. Under pressure they did not ask first for victory — they asked first for forgiveness, treating their own sins as the thing most likely to be holding them back.'],

  ['hasbunallah', '3:173', 'Allah is sufficient for us', ['fear', 'trust', 'hardship'],
    'Ḥasbuna llāhu wa-niʿma l-wakīl.',
    'Said by the believers when they were told that armies had gathered against them — and it increased them in faith rather than fear. Ibrahim said it when he was thrown into the fire. Four words, and they are the whole doctrine of tawakkul.'],

  ['you-did-not-create-this-aimlessly', '3:191-194', 'You did not create this without purpose', ['night', 'reflection', 'hereafter'],
    null,
    'The dua of those who remember Allah standing, sitting and on their sides, and reflect on the creation of the heavens and the earth. The Prophet ﷺ would recite this passage on waking in the night. It moves from noticing the sky, to fearing the Fire, to asking for the promise of the messengers.'],

  ['adams-repentance', '7:23', 'We have wronged ourselves', ['repentance', 'forgiveness', 'sin'],
    'Rabbanā ẓalamnā anfusanā wa-in lam taghfir lanā wa-tarḥamnā la-nakūnanna mina l-khāsirīn.',
    'The first repentance ever made. Adam and Hawwa and Iblis all disobeyed; the difference was not the sin but what came after it. This is the sentence that separates them: owning it, without excuse and without argument.'],

  ['let-us-die-as-muslims', '7:126', 'Let us die in submission to You', ['martyrdom', 'steadfastness', 'patience'],
    'Rabbanā afrigh ʿalaynā ṣabran wa-tawaffanā muslimīn.',
    'The magicians of Pharaoh said this. That morning they had come for a prize; by the afternoon they were being threatened with crucifixion for believing, and they asked only for patience and a good death. Faith that was hours old and did not move.'],

  ['upon-allah-we-rely', '10:85-86', 'Upon Allah we have relied', ['oppression', 'trust', 'hardship'],
    'Rabbanā lā tajʿalnā fitnatan li-l-qawmi ẓ-ẓālimīn, wa-najjinā bi-raḥmatika mina l-qawmi l-kāfirīn.',
    'The young followers of Musa under Pharaoh\'s rule. The first half is unusual: save us from becoming a trial *for* the oppressors — do not let our suffering become their proof that they were right.'],

  ['establisher-of-prayer', '14:40-41', 'Make me an establisher of prayer', ['prayer', 'parents', 'family'],
    'Rabbi jʿalnī muqīma ṣ-ṣalāti wa-min dhurriyyatī, rabbanā wa-taqabbal duʿāʾ.',
    'Ibrahim, in old age, in a barren valley. He does not ask to pray but to be *an establisher* of prayer — and immediately extends it to his descendants, and then asks that even the asking be accepted.'],

  ['mercy-on-my-parents', '17:24', 'Have mercy on them as they raised me', ['parents', 'family', 'mercy'],
    'Rabbi rḥamhumā kamā rabbayānī ṣaghīrā.',
    'It follows the command to lower the wing of humility to one\'s parents out of mercy. The comparison is exact and unmeetable: as they raised me when I was small. You cannot repay it, so you ask Allah to.'],

  ['a-sound-entrance-and-exit', '17:80', 'A sound entrance and a sound exit', ['travel', 'work', 'beginnings'],
    'Rabbi adkhilnī mudkhala ṣidqin wa-akhrijnī mukhraja ṣidqin wa-jʿal lī min ladunka sulṭānan naṣīrā.',
    'Revealed in connection with the Hijrah — leaving Makkah and entering Madinah. It has been used ever since for any entering and leaving: a journey, an office, a decision, a role.'],

  ['the-people-of-the-cave', '18:10', 'Grant us mercy and guide our affair', ['hardship', 'guidance', 'youth'],
    'Rabbanā ātinā min ladunka raḥmatan wa-hayyiʾ lanā min amrinā rashadā.',
    'Said by young men who had walked away from their entire society and had no plan beyond the cave they were hiding in. They asked for mercy and for their affair to be *arranged* for them — and then slept for three hundred years while it was.'],

  ['expand-my-chest', '20:25-28', 'Expand my chest and ease my task', ['speech', 'work', 'anxiety', 'teaching'],
    'Rabbi shraḥ lī ṣadrī wa-yassir lī amrī wa-ḥlul ʿuqdatan min lisānī yafqahū qawlī.',
    'Musa said this when he was sent to Pharaoh. The order matters: first the chest, then the task, then the tongue. He asks to be changed before he asks for the job to be made easier.'],

  ['increase-me-in-knowledge', '20:114', 'Increase me in knowledge', ['knowledge', 'study', 'daily'],
    'Rabbi zidnī ʿilmā.',
    'The only thing in the Qur\'an that the Prophet ﷺ is commanded to ask for more of. Three words, and the whole scholarly tradition of Islam rests on them.'],

  ['ayyubs-prayer', '21:83', 'Adversity has touched me', ['illness', 'hardship', 'patience'],
    'Annī massaniya ḍ-ḍurru wa-anta arḥamu r-rāḥimīn.',
    'Ayyub had lost his health, his wealth and his children over many years. When he finally spoke, he did not state a demand. He described his condition and then described his Lord, and left the sentence there.'],

  ['dua-of-yunus', '21:87', 'The prayer of Yunus', ['distress', 'repentance', 'relief'],
    'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn.',
    'Called out from inside the whale, inside the sea, inside the night — three darknesses. The Prophet ﷺ said that no Muslim ever supplicates with it for anything without Allah answering him. It contains no request at all: only tawhid, glorification, and an admission.'],

  ['do-not-leave-me-alone', '21:89', 'Do not leave me alone', ['children', 'loneliness', 'family'],
    'Rabbi lā tadharnī fardan wa-anta khayru l-wārithīn.',
    'Zakariya again, and this time you can hear the fear under it — not of dying, but of dying with nothing continuing. He immediately answers his own fear: and You are the best of inheritors.'],

  ['refuge-from-the-whisperings', '23:97-98', 'Refuge from the whisperings of devils', ['protection', 'waswas', 'anger'],
    'Rabbi aʿūdhu bika min hamazāti sh-shayāṭīni wa-aʿūdhu bika rabbi an yaḥḍurūn.',
    'Two requests, and the second is the sharper one: that they not even be present around me. The Qur\'an consistently treats the enemy as a suggestion rather than a power — and the countermeasure it prescribes is correspondingly small.'],

  ['best-of-the-merciful', '23:109', 'Forgive us and have mercy on us', ['forgiveness', 'mercy', 'daily'],
    'Rabbanā āmannā fa-ghfir lanā wa-rḥamnā wa-anta khayru r-rāḥimīn.',
    'Spoken by a group of Allah\'s servants who were mocked for saying it, to the point that the mockery made the mockers forget the remembrance of Allah entirely.'],

  ['avert-from-us-the-punishment', '25:65-66', 'Avert from us the punishment of Hell', ['hereafter', 'fear', 'night'],
    'Rabbana-ṣrif ʿannā ʿadhāba jahannama, inna ʿadhābahā kāna gharāmā.',
    'Part of the description of the servants of the Most Merciful — those who walk gently, who spend the night in prostration, and who, despite all of it, are still asking to be spared.'],

  ['comfort-of-our-eyes', '25:74', 'Comfort of our eyes', ['marriage', 'family', 'children'],
    'Rabbanā hab lanā min azwājinā wa-dhurriyyātinā qurrata aʿyunin wa-jʿalnā li-l-muttaqīna imāmā.',
    'The last of the qualities of the servants of the Most Merciful. It asks for family to be a coolness of the eyes — and then, in the same breath, to be made an example for the God-conscious. The household and the public role are asked for together.'],

  ['join-me-with-the-righteous', '26:83-85', 'Join me with the righteous', ['legacy', 'paradise', 'speech'],
    'Rabbi hab lī ḥukman wa-alḥiqnī bi-ṣ-ṣāliḥīn, wa-jʿal lī lisāna ṣidqin fi l-ākhirīn.',
    'Ibrahim asks for a truthful tongue among later generations — to be spoken of well by people not yet born. Four thousand years later, every Muslim in every prayer sends blessings on him and his family.'],

  ['enable-me-to-be-grateful', '27:19', 'Enable me to be grateful', ['gratitude, blessings', 'work'],
    'Rabbi awziʿnī an ashkura niʿmataka llatī anʿamta ʿalayya wa-ʿalā wālidayya wa-an aʿmala ṣāliḥan tarḍāh.',
    'Sulayman said this after smiling at an ant. He had the wind, the jinn and the speech of birds, and what prompted the prayer was overhearing an insect warn its colony. Gratitude is asked for as a capacity that has to be granted.'],

  ['i-have-wronged-myself', '28:16', 'I have wronged myself, so forgive me', ['repentance', 'forgiveness', 'regret'],
    'Rabbi innī ẓalamtu nafsī fa-ghfir lī.',
    'Musa said this after a blow he never meant to kill. Immediate, unqualified, with no account of the provocation — and the answer in the verse is immediate too.'],

  ['i-am-in-need', '28:24', 'I am in need of whatever good You send me', ['provision', 'poverty', 'work'],
    'Rabbi innī limā anzalta ilayya min khayrin faqīr.',
    'Musa said it in Madyan — a fugitive, hungry, having just watered someone else\'s flock for nothing and gone to sit in the shade. He does not name what he needs. Within the hour he had work, a home and a wife.'],

  ['the-angels-prayer-for-the-believers', '40:7-9', 'The prayer the angels make for you', ['forgiveness', 'family', 'paradise'],
    null,
    'The bearers of the Throne ask forgiveness for the believers on earth — and then ask that their parents, spouses and descendants be admitted with them. Worth reading slowly: this is being said about you, by them, now.'],

  ['gratitude-and-my-parents', '46:15', 'Let me be grateful, and set my offspring right', ['parents', 'children', 'gratitude', 'forty'],
    'Rabbi awziʿnī an ashkura niʿmataka llatī anʿamta ʿalayya wa-ʿalā wālidayya wa-an aʿmala ṣāliḥan tarḍāhu wa-aṣliḥ lī fī dhurriyyatī.',
    'The dua of a person who has reached forty. It looks backwards to parents and forwards to children in a single sentence, and asks to be made useful in both directions.'],

  ['our-brothers-who-preceded-us', '59:10', 'Forgive us and our brothers who came before us', ['community', 'forgiveness', 'brotherhood'],
    'Rabbana-ghfir lanā wa-li-ikhwāninā lladhīna sabaqūnā bi-l-īmāni wa-lā tajʿal fī qulūbinā ghillan li-lladhīna āmanū.',
    'The prayer of those who came after the first believers. It asks for forgiveness for people they never met, and then for their own hearts to be cleaned of resentment toward the living.'],

  ['upon-you-we-rely', '60:4-5', 'Upon You we rely and to You we turn', ['trust', 'hardship', 'enemies'],
    'Rabbanā ʿalayka tawakkalnā wa-ilayka anabnā wa-ilayka l-maṣīr.',
    'From the example set by Ibrahim and those with him. Reliance, turning back, and destination — the three stated together, so that trust is not mistaken for passivity.'],

  ['perfect-our-light', '66:8', 'Perfect our light for us', ['hereafter', 'forgiveness', 'repentance'],
    'Rabbanā atmim lanā nūranā wa-ghfir lanā, innaka ʿalā kulli shayʾin qadīr.',
    'Said by the believers on the Day when their light runs ahead of them and to their right. They already have light and they are asking for it to be completed — which is the position of anyone who has some faith and knows it is not enough.'],

  ['a-house-near-you-in-paradise', '66:11', 'Build for me a house near You in Paradise', ['oppression', 'paradise', 'hardship'],
    'Rabbi bni lī ʿindaka baytan fi l-jannati wa-najjinī min firʿawna wa-ʿamalihi.',
    'Asiya, the wife of Pharaoh, in the palace of the man claiming to be god. She asked for the neighbour before the house — *ʿindaka*, near You — and only then for rescue.'],

  ['al-falaq', '113:1-5', 'Refuge from the evil of what He created', ['protection', 'morning', 'evening', 'night', 'envy'],
    null,
    'The first of the two surahs of refuge. It guards the perimeter — the dark when it settles, harm from outside, and envy when the envier envies. Recited morning and evening, before sleep, and over illness.'],

  ['an-nas', '114:1-6', 'Refuge from the retreating whisperer', ['protection', 'morning', 'evening', 'waswas'],
    null,
    'The companion to Al-Falaq, and it guards the other direction — inside the chest. Three names of Allah are used before the threat is even named, as if to establish who is in charge before mentioning the whisperer at all. It is the last surah of the Qur\'an, and the danger it ends on is a suggestion.'],
];

// Some of these supplications sit inside a longer narrative verse. Rather than
// retyping the Arabic, we slice the API's own word list, and take the quoted span
// out of the translation (or from an explicit anchor where it isn't quoted).
// `ar` is the first word of the supplication with its diacritics stripped, and
// `en` the phrase the translation opens it with. Both are matched against the
// FIRST verse of the range; later verses are kept whole. `endW` cuts a trailing
// narrative clause. If an anchor does not match we keep the whole verse, so the
// worst case is extra context rather than mangled scripture.
const TRIM = {
  'accept-from-us': { ar: 'ربنا', en: 'Our Lord, accept' },
  'good-in-both-worlds': { ar: 'ربنا', en: 'Our Lord, give us' },
  'forgive-our-excess': { ar: 'ربنا', en: 'Our Lord, forgive us' },
  'hasbunallah': { ar: 'حسبنا', en: 'Sufficient for us is Allah' },
  'you-did-not-create-this-aimlessly': { ar: 'ربنا', en: 'Our Lord, You did not create' },
  'adams-repentance': { ar: 'ربنا', en: 'Our Lord, we have wronged' },
  'pour-patience-upon-us': { ar: 'ربنا', en: 'Our Lord, pour' },
  // 7:126 says "our Lord" once in the preceding clause before the vocative.
  'let-us-die-as-muslims': { ar: 'ربنا', nth: 1, en: 'Our Lord, pour' },
  'do-not-let-our-hearts-deviate': { ar: 'ربنا', en: 'Our Lord, let not' },
  'join-me-with-the-righteous': { ar: 'رب', en: 'My Lord, grant me' },
  'upon-allah-we-rely': { ar: 'على', en: 'Upon Allah do we rely' },
  'mercy-on-my-parents': { ar: 'رب', en: 'My Lord, have mercy' },
  'a-sound-entrance-and-exit': { ar: 'رب', en: 'My Lord, cause me to enter' },
  'the-people-of-the-cave': { ar: 'ربنا', en: 'Our Lord, grant us' },
  'expand-my-chest': { ar: 'رب', en: 'My Lord, expand' },
  'increase-me-in-knowledge': { ar: 'رب', en: 'My Lord, increase me in knowledge' },
  'ayyubs-prayer': { ar: 'انى', en: 'Indeed, adversity has touched me' },
  'dua-of-yunus': { ar: 'لا', en: 'There is no deity except You' },
  'do-not-leave-me-alone': { ar: 'رب', en: 'My Lord, do not leave me' },
  'refuge-from-the-whisperings': { ar: 'رب', en: 'My Lord, I seek refuge' },
  'best-of-the-merciful': { ar: 'ربنا', en: 'Our Lord, we have believed' },
  'avert-from-us-the-punishment': { ar: 'ربنا', en: 'Our Lord, avert' },
  'comfort-of-our-eyes': { ar: 'ربنا', en: 'Our Lord, grant us' },
  'enable-me-to-be-grateful': { ar: 'رب', en: 'My Lord, enable me' },
  'gratitude-and-my-parents': { ar: 'رب', en: 'My Lord, enable me' },
  'i-have-wronged-myself': { ar: 'رب', en: 'My Lord, indeed I have wronged', endAr: 'لى' },
  'i-am-in-need': { ar: 'رب', en: 'My Lord, indeed I am' },
  'good-offspring': { ar: 'رب', en: 'My Lord, grant me' },
  'our-brothers-who-preceded-us': { ar: 'ربنا', en: 'Our Lord, forgive us' },
  'upon-you-we-rely': { ar: 'ربنا', en: 'Our Lord, upon You we have relied' },
  'perfect-our-light': { ar: 'ربنا', en: 'Our Lord, perfect for us' },
  'a-house-near-you-in-paradise': { ar: 'رب', en: 'My Lord, build for me' },
};

/** Strip Arabic diacritics, tatweel and alef variants so anchors can be plain. */
function bare(w) {
  return w
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[^ء-ي]/g, '');
}

function trimArabic(words, trim) {
  // `nth` picks a later occurrence where the same word appears earlier in the verse.
  const hits = words.map((w, i) => (bare(w) === trim.ar ? i : -1)).filter(i => i >= 0);
  const start = hits[trim.nth ?? 0] ?? -1;
  if (start < 0) return null;
  let end = words.length - 1;
  if (trim.endAr) {
    const e = words.findIndex((w, i) => i > start && bare(w) === trim.endAr);
    if (e > 0) end = e;
  }
  return words.slice(start, end + 1).join(' ');
}

function trimEnglish(text, anchor) {
  const i = anchor ? text.indexOf(anchor) : -1;
  if (i < 0) return text;
  return text.slice(i).replace(/["”]\s*$/, '').trim();
}

const wordCache = new Map();
async function words(surah, ayah) {
  const key = `${surah}:${ayah}`;
  if (!wordCache.has(key)) {
    const r = await fetch(`${QF}/verses/by_key/${key}?words=true&word_fields=text_uthmani`);
    const j = await r.json();
    wordCache.set(key, (j.verse?.words || []).filter(w => w.char_type_name !== 'end').map(w => w.text_uthmani || w.text));
  }
  return wordCache.get(key);
}

const uthmaniCache = new Map();
const transCache = new Map();

async function uthmani(surah) {
  if (!uthmaniCache.has(surah)) {
    const r = await fetch(`${QF}/verses/by_chapter/${surah}?language=en&fields=text_uthmani&per_page=300`);
    const j = await r.json();
    const map = {};
    for (const v of j.verses || []) map[v.verse_number] = v.text_uthmani;
    uthmaniCache.set(surah, map);
  }
  return uthmaniCache.get(surah);
}

async function translation(surah) {
  if (!transCache.has(surah)) {
    const r = await fetch(`${AQ}/surah/${surah}/en.sahih`);
    const j = await r.json();
    const map = {};
    for (const a of j.data?.ayahs || []) map[a.numberInSurah] = a.text;
    transCache.set(surah, map);
  }
  return transCache.get(surah);
}

function yamlList(xs) {
  return `[${xs.map(x => JSON.stringify(x)).join(', ')}]`;
}

function block(s) {
  // YAML literal block, so quotes and colons in the text are safe.
  return s.split('\n').map(l => `  ${l}`).join('\n');
}

const surahNames = await fetch(`${QF}/chapters?language=en`).then(r => r.json()).then(j =>
  Object.fromEntries((j.chapters || []).map(c => [c.id, c.name_simple]))
);

fs.mkdirSync(OUT, { recursive: true });
let n = 0;

for (const [slug, ref, title, occasion, translit, note] of DUAS) {
  const m = ref.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  const surah = +m[1], from = +m[2], to = m[3] ? +m[3] : +m[2];

  const ar = await uthmani(surah);
  const en = await translation(surah);

  const arabic = [];
  const english = [];
  const trim = TRIM[slug];
  for (let a = from; a <= to; a++) {
    // Only the opening verse of a range carries the narrative frame.
    if (trim && a === from) {
      const cut = trimArabic(await words(surah, a), trim);
      if (cut) {
        arabic.push(cut);
        english.push(trimEnglish(en[a] || '', trim.en));
        continue;
      }
      console.warn(`\n! anchor "${trim.ar}" not found in ${surah}:${a} (${slug}) — keeping the whole verse`);
    }
    if (ar[a]) arabic.push(ar[a]);
    if (en[a]) english.push(en[a]);
  }
  if (!arabic.length) { console.warn(`! no text for ${slug} (${ref})`); continue; }

  const body = [
    '---',
    `slug: ${slug}`,
    `title: ${JSON.stringify(title)}`,
    `kind: quranic`,
    `surah: ${surah}`,
    `ayah_from: ${from}`,
    `ayah_to: ${to}`,
    `reference: ${JSON.stringify(`${surahNames[surah] ?? `Surah ${surah}`} ${ref}`)}`,
    `source: ${JSON.stringify(`Qur'an ${ref}`)}`,
    `related_ayahs: ${yamlList([ref])}`,
    `occasion: ${yamlList(occasion.flatMap(o => o.split(',').map(x => x.trim())))}`,
    'arabic: |-',
    block(arabic.join(' ')),
    'translation: |-',
    block(english.join(' ')),
    ...(translit ? ['transliteration: |-', block(translit)] : []),
    `favourite: true`,
    '---',
    '',
    note,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT, `${slug}.md`), body, 'utf8');
  n++;
  process.stdout.write('.');
}

console.log(`\nwrote ${n} Qur'anic duas to ${OUT}`);
