import { DISPLAY_NAME_MAX } from '../types';

const FIRST_NAMES = [
  'Ragnar', 'Bjorn', 'Lagertha', 'Sigurd', 'Freya', 'Astrid', 'Leif',
  'Harald', 'Ivar', 'Rollo', 'Erik', 'Torstein', 'Ubbe', 'Sigrid',
  'Gunnar', 'Einar', 'Thora', 'Kjetil', 'Valdis', 'Styrkar', 'Thyra',
  'Sven', 'Olaf', 'Hakon', 'Solveig', 'Aslaug', 'Rorik', 'Yngvar'
];

const LAST_NAMES = [
  'Ironbeard', 'Shieldbreaker', 'Bloodaxe', 'Frostweaver', 'Stormcaller',
  'Ravenshadow', 'Wolfjaw', 'Dragonbane', 'Oakenshield', 'Swiftarrow',
  'Seaborn', 'Thunderfist', 'Winterhart', 'Bearclaw', 'Spearshaker',
  'Skullsmasher', 'Runeweaver', 'Galeborn', 'Fireheart', 'Shadowrider'
];

export function clipDisplayName(name: string): string {
  return name.trim().slice(0, DISPLAY_NAME_MAX);
}

export function generateRandomNorseName(existingNames: string[] = []): string {
  const existingSet = new Set(existingNames.map(n => n.toLowerCase()));
  
  // Try up to 50 combinations
  for (let i = 0; i < 50; i++) {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${first} ${last}`;
    if (!existingSet.has(name.toLowerCase())) {
      return name;
    }
  }

  // Fallback with number
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${first} ${last} ${num}`;
}
