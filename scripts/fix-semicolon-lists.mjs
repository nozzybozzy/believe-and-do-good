// The seven semicolon lists in our own prose, rewritten by hand.
// The other flagged lines are Qur'an translations and stay exactly as they are.
import fs from 'node:fs';

const EDITS = [
  ['content/names/04-al-quddus.md',
    'He is pure; He loves purity; the heart is the organ that is meant to be kept clean.',
    'He is pure, He loves purity, and the heart is the organ meant to be kept clean.'],

  ['content/names/06-al-mumin.md',
    'Things break; people leave; the future is not in your hands.',
    'Things break. People leave. The future is not in your hands.'],

  ['content/names/51-al-haqq.md',
    'He is the Real, as against everything whose existence is borrowed; the True, as against every claim; and the One to whom everything is owed.',
    'He is the Real, as against everything whose existence is borrowed. He is the True, as against every claim. And He is the One to whom everything is owed.'],

  ['content/seerah/023-the-year-of-grief.md',
    'Abu Talib was the shield; with him gone, the Prophet ﷺ had no legal protection in Makkah at all, and Quraysh knew it immediately and escalated. Khadijah was the shelter; with her gone, there was nowhere in Makkah to put the weight down.',
    'Abu Talib was the shield. With him gone, the Prophet ﷺ had no legal protection in Makkah at all, and Quraysh knew it immediately and escalated. Khadijah was the shelter. With her gone, there was nowhere in Makkah to put the weight down.'],

  ['content/seerah/034-the-covenant-of-madinah.md',
    'Its terms: the parties form a single body politic for the purposes of defence; each community keeps its own religion and its own law in its own affairs; each bears its own expenses; none may make a separate peace with an aggressor; aggression against the city is to be met jointly; the wronged are to be supported; and any dispute is referred to **Muhammad ﷺ** as arbitrator.',
    'Its terms. The parties form a single body politic for the purposes of defence. Each community keeps its own religion and its own law in its own affairs, and bears its own expenses. None may make a separate peace with an aggressor. Aggression against the city is to be met jointly. The wronged are to be supported. Any dispute is referred to **Muhammad ﷺ** as arbitrator.'],

  ['content/seerah/040-the-battle-of-the-trench.md',
    'Abu Sufyan raised four thousand from Makkah alone; **Ghatafan** and **Banu Sulaym** joined from the east; and Banu an-Nadir, now in exile at Khaybar, worked the tribes.',
    'Abu Sufyan raised four thousand from Makkah alone. **Ghatafan** and **Banu Sulaym** joined from the east. Banu an-Nadir, now in exile at Khaybar, worked the tribes.'],

  ['content/seerah/014-the-first-believers.md',
    'Others came in early from the other end of the social scale: **Bilal ibn Rabah**, an Abyssinian slave; **Abu Ubaydah ibn al-Jarrah**; **Uthman ibn Maz\'un**.',
    'Others came in early from the other end of the social scale. **Bilal ibn Rabah**, an Abyssinian slave. **Abu Ubaydah ibn al-Jarrah**. **Uthman ibn Maz\'un**.'],
];

let done = 0;
for (const [file, from, to] of EDITS) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) { console.log('NOT FOUND in ' + file); continue; }
  fs.writeFileSync(file, s.replace(from, to), 'utf8');
  done++;
}
console.log(`rewrote ${done} of ${EDITS.length}`);
