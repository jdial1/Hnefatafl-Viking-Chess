import { DISPLAY_NAME_MAX } from '../types';

const FIRST_NAMES = [
  'Ragnar', 'Bjorn', 'Lagertha', 'Sigurd', 'Freya', 'Astrid', 'Leif',
  'Harald', 'Ivar', 'Rollo', 'Erik', 'Torstein', 'Ubbe', 'Sigrid',
  'Gunnar', 'Einar', 'Thora', 'Kjetil', 'Valdis', 'Styrkar', 'Thyra',
  'Sven', 'Olaf', 'Hakon', 'Solveig', 'Aslaug', 'Rorik', 'Yngvar',
  'Helga', 'Ingrid', 'Revna', 'Torvi', 'Halfdan', 'Gorm', 'Freydis', 'Gudrun',
  'Njord', 'Skadi', 'Runa', 'Arne', 'Bodil', 'Dagmar', 'Eirik', 'Frode',
  'Gunnhild', 'Hilda', 'Jorunn', 'Kari', 'Liv', 'Magnus', 'Njal', 'Odd',
  'Ragnhild', 'Sif', 'Tove', 'Unn',
];

const LAST_NAMES = [
  'Ironbeard', 'Shieldbreaker', 'Bloodaxe', 'Frostweaver', 'Stormcaller',
  'Ravenshadow', 'Wolfjaw', 'Dragonbane', 'Oakenshield', 'Swiftarrow',
  'Seaborn', 'Thunderfist', 'Winterhart', 'Bearclaw', 'Spearshaker',
  'Skullsmasher', 'Runeweaver', 'Galeborn', 'Fireheart', 'Shadowrider',
  'Icevein', 'Nightwolf', 'Goldring', 'Waveborn', 'Ashenhelm',
  'Crowfoot', 'Stonefist', 'Redsail', 'Grimholt', 'Meadhorn',
  'Boarhide', 'Saltwind', 'Ironwood', 'Paleaxe', 'Longship',
  'Frostborn', 'Keeneye', 'Oathkeeper', 'Warguard', 'Thornhelm',
];

function shuffled<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function clipDisplayName(name: string): string {
  return name.trim().slice(0, DISPLAY_NAME_MAX);
}

export function generateRandomNorseName(existingNames: string[] = []): string {
  const taken = new Set(existingNames.map((name) => clipDisplayName(name).toLowerCase()));
  const firsts = shuffled(FIRST_NAMES);
  const lasts = shuffled(LAST_NAMES);

  for (const first of firsts) {
    for (const last of lasts) {
      const name = clipDisplayName(`${first} ${last}`);
      if (!taken.has(name.toLowerCase())) return name;
    }
  }

  for (let n = 2; n < 100; n++) {
    const suffix = ` ${n}`;
    const name = clipDisplayName(
      `${firsts[0]} ${lasts[0]}`.slice(0, DISPLAY_NAME_MAX - suffix.length) + suffix
    );
    if (!taken.has(name.toLowerCase())) return name;
  }

  return clipDisplayName(`${firsts[0]} ${lasts[0]}`);
}
