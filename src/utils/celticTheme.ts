// Utility to handle random Celtic Knot patterns and color themes for the UI

function escapeSvg(svgString: string): string {
  return encodeURIComponent(svgString)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
}

export interface CelticPattern {
  id: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
  getSvg: (strokeColor: string, outlineColor?: string) => string;
}

export const KNOT_COLORS = {
  baseColor: '#0284c7',   // Blue when not in queue
  activeColor: '#f59e0b', // Gold when queuing and animated
};

export const CELTIC_PATTERNS: CelticPattern[] = [
  {
    id: 'classic-interlace',
    name: 'Classic Interlace Braid',
    tileWidth: 32,
    tileHeight: 16,
    getSvg: (stroke, outline = '#020617') => `
      <svg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'>
        <g fill='none'>
          <path d='M 0 18 C 5 18, 15 2, 20 2' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 0 18 C 5 18, 15 2, 20 2' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
          <path d='M 0 10 L 20 10' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 0 10 L 20 10' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
          <path d='M 0 2 C 5 2, 15 18, 20 18' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 0 2 C 5 2, 15 18, 20 18' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
          <path d='M 20 18 C 25 18, 35 2, 40 2' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 20 18 C 25 18, 35 2, 40 2' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
          <path d='M 20 10 L 40 10' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 20 10 L 40 10' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
          <path d='M 20 2 C 25 2, 35 18, 40 18' stroke='${outline}' stroke-width='5' stroke-linecap='round'/>
          <path d='M 20 2 C 25 2, 35 18, 40 18' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round'/>
        </g>
      </svg>
    `.trim()
  },
  {
    id: 'triquetra-ring',
    name: 'Triquetra Ring Chain',
    tileWidth: 32,
    tileHeight: 16,
    getSvg: (stroke, outline = '#020617') => `
      <svg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'>
        <g fill='none'>
          <circle cx='10' cy='10' r='6.5' stroke='${outline}' stroke-width='5'/>
          <circle cx='10' cy='10' r='6.5' stroke='${stroke}' stroke-width='1.8'/>
          <circle cx='30' cy='10' r='6.5' stroke='${outline}' stroke-width='5'/>
          <circle cx='30' cy='10' r='6.5' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 10 Q 10 2, 20 10 Q 30 18, 40 10' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 10 Q 10 2, 20 10 Q 30 18, 40 10' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 10 Q 10 18, 20 10 Q 30 2, 40 10' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 10 Q 10 18, 20 10 Q 30 2, 40 10' stroke='${stroke}' stroke-width='1.8'/>
        </g>
      </svg>
    `.trim()
  },
  {
    id: 'viking-key-meander',
    name: 'Viking Angular Key Braid',
    tileWidth: 32,
    tileHeight: 16,
    getSvg: (stroke, outline = '#020617') => `
      <svg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'>
        <g fill='none' stroke-linecap='round' stroke-linejoin='round'>
          <path d='M 0 2 L 10 18 L 20 2 L 30 18 L 40 2' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 2 L 10 18 L 20 2 L 30 18 L 40 2' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 18 L 10 2 L 20 18 L 30 2 L 40 18' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 18 L 10 2 L 20 18 L 30 2 L 40 18' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 10 L 40 10' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 10 L 40 10' stroke='${stroke}' stroke-width='1.8'/>
        </g>
      </svg>
    `.trim()
  },
  {
    id: 'serpent-loop',
    name: 'Midgard Serpent Braid',
    tileWidth: 32,
    tileHeight: 16,
    getSvg: (stroke, outline = '#020617') => `
      <svg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'>
        <g fill='none'>
          <path d='M 0 4 C 10 4, 10 16, 20 16 C 30 16, 30 4, 40 4' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 4 C 10 4, 10 16, 20 16 C 30 16, 30 4, 40 4' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 16 C 10 16, 10 4, 20 4 C 30 4, 30 16, 40 16' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 16 C 10 16, 10 4, 20 4 C 30 4, 30 16, 40 16' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 10 C 5 2, 15 18, 20 10 C 25 2, 35 18, 40 10' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 10 C 5 2, 15 18, 20 10 C 25 2, 35 18, 40 10' stroke='${stroke}' stroke-width='1.8'/>
        </g>
      </svg>
    `.trim()
  },
  {
    id: 'diamond-eternity',
    name: 'Celtic Diamond Chain',
    tileWidth: 32,
    tileHeight: 16,
    getSvg: (stroke, outline = '#020617') => `
      <svg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'>
        <g fill='none'>
          <path d='M 0 10 L 10 3 L 20 10 L 10 17 Z' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 10 L 10 3 L 20 10 L 10 17 Z' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 20 10 L 30 3 L 40 10 L 30 17 Z' stroke='${outline}' stroke-width='5'/>
          <path d='M 20 10 L 30 3 L 40 10 L 30 17 Z' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 3 Q 20 20, 40 3' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 3 Q 20 20, 40 3' stroke='${stroke}' stroke-width='1.8'/>
          <path d='M 0 17 Q 20 0, 40 17' stroke='${outline}' stroke-width='5'/>
          <path d='M 0 17 Q 20 0, 40 17' stroke='${stroke}' stroke-width='1.8'/>
        </g>
      </svg>
    `.trim()
  }
];

let currentPattern: CelticPattern | null = null;

export function applyCelticTheme(pattern: CelticPattern): CelticPattern {
  const baseSvg = pattern.getSvg(KNOT_COLORS.baseColor);
  const activeSvg = pattern.getSvg(KNOT_COLORS.activeColor);

  const baseDataUrl = `url("data:image/svg+xml,${escapeSvg(baseSvg)}")`;
  const activeDataUrl = `url("data:image/svg+xml,${escapeSvg(activeSvg)}")`;

  const root = document.documentElement;
  root.style.setProperty('--celtic-knot-bg', baseDataUrl);
  root.style.setProperty('--celtic-knot-bg-active', activeDataUrl);
  root.style.setProperty('--celtic-knot-color', KNOT_COLORS.baseColor);
  root.style.setProperty('--celtic-knot-active-color', KNOT_COLORS.activeColor);
  root.style.setProperty('--celtic-knot-tile-width', `${pattern.tileWidth}px`);

  currentPattern = pattern;
  return currentPattern;
}

export function randomizeCelticTheme(): CelticPattern {
  const randomPattern = CELTIC_PATTERNS[Math.floor(Math.random() * CELTIC_PATTERNS.length)];
  return applyCelticTheme(randomPattern);
}

export function getCurrentCelticTheme(): CelticPattern {
  if (!currentPattern) {
    return randomizeCelticTheme();
  }
  return currentPattern;
}
