// Slogan phrasing and hedges, rewritten by hand.
import fs from 'node:fs';

const EDITS = [
  // Slogans.
  ['content/names/36-al-ali.md',
    'That is not a coincidence of liturgy. The Prophet ﷺ said',
    'The Prophet ﷺ said'],
  ['content/wisdom/lesson/sufficient-for-us.md',
    'That is the point of the phrase. It is not a way of avoiding action,',
    'The phrase is not a way of avoiding action,'],
  ['content/wisdom/lesson/the-centre-of-gravity.md',
    'That is the whole argument in one line, and it is why the Qur\'an spends',
    'It is why the Qur\'an spends'],
  ['content/wisdom/story/barsisa.md',
    'That is the whole method, and it is why the countermeasure the Book prescribes is applied at the *whisper*, not at the sin.',
    'The countermeasure the Book prescribes is applied at the *whisper*, not at the sin.'],

  // Hedges.
  ['content/seerah/002-the-blessed-birth.md',
    'It is worth pausing on what the Qur\'an later does with this beginning.',
    'Look at what the Qur\'an later does with this beginning.'],
  ['content/seerah/039-dealing-with-the-treaties.md',
    'It is worth stating plainly what these episodes were and were not.',
    'What these episodes were, and were not, should be stated plainly.'],
  ['content/seerah/041-banu-qurayzah.md',
    'This is a hard passage, and pretending otherwise helps nobody. It is worth being exact about what it was:',
    'This is a hard passage, and pretending otherwise helps nobody. What it was, exactly:'],
  ['content/names/84-malik-ul-mulk.md',
    'It is worth reciting when watching the news, and worth reciting',
    'Recite it when watching the news, and recite it'],
];

let done = 0;
for (const [file, from, to] of EDITS) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) { console.log('NOT FOUND: ' + file + '  ' + from.slice(0, 50)); continue; }
  fs.writeFileSync(file, s.replace(from, to), 'utf8');
  done++;
}
console.log(`rewrote ${done} of ${EDITS.length}`);
