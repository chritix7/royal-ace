import type { Sym } from "./slots";

/**
 * Symbols of Winter Royale (the limited winter machine), drawn in SVG
 * (data: URIs). Same recipe as the other machines: flat shapes, a few
 * gradients, a dark outline — light to paint on phones.
 */
const wrap = (defs: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`;
const grad = (id: string, a: string, b: string, mid?: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/>${mid ? `<stop offset=".5" stop-color="${mid}"/>` : ""}<stop offset="1" stop-color="${b}"/></linearGradient>`;
const toSrc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const art = (m: Record<Sym, string>) => Object.fromEntries((Object.keys(m) as Sym[]).map((s) => [s, toSrc(m[s])])) as Record<Sym, string>;

const K = "#0b1220";
const GOLD = grad("g", "#fff4c2", "#a87a2c", "#e6bd5c");
const ICE = grad("ice", "#ffffff", "#7fb6e6", "#cfe7ff");

const CANE = wrap(
  `<clipPath id="c"><path d="M38 92 V36 A16 16 0 0 1 70 36 V46 H60 V36 A6 6 0 0 0 48 36 V92 Z"/></clipPath>`,
  `<path d="M38 92 V36 A16 16 0 0 1 70 36 V46 H60 V36 A6 6 0 0 0 48 36 V92 Z" fill="#fff"/>
   <g clip-path="url(#c)" fill="#d22b3a">${Array.from({ length: 9 }, (_, i) => `<path d="M20 ${100 - i * 11} L80 ${78 - i * 11} V${84 - i * 11} L20 ${106 - i * 11} Z"/>`).join("")}</g>
   <path d="M38 92 V36 A16 16 0 0 1 70 36 V46 H60 V36 A6 6 0 0 0 48 36 V92 Z" fill="none" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"/>
   <path d="M42 40 A11 11 0 0 1 52 26" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`,
);
const BAUBLE = wrap(
  GOLD + `<radialGradient id="b" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#7fd0ff"/><stop offset=".6" stop-color="#1f5fae"/><stop offset="1" stop-color="#0c2550"/></radialGradient>`,
  `<path d="M50 6 V18" stroke="url(#g)" stroke-width="3"/><circle cx="50" cy="6" r="4" fill="none" stroke="url(#g)" stroke-width="2.5"/>
   <rect x="41" y="16" width="18" height="10" rx="2" fill="url(#g)" stroke="${K}" stroke-width="2.5"/>
   <circle cx="50" cy="58" r="33" fill="url(#b)" stroke="${K}" stroke-width="3.5"/>
   <path d="M19 52 Q50 64 81 52" stroke="url(#g)" stroke-width="4" fill="none"/>
   <g fill="#fff4c2"><circle cx="35" cy="57" r="2.4"/><circle cx="50" cy="61" r="2.4"/><circle cx="65" cy="57" r="2.4"/></g>
   <ellipse cx="38" cy="42" rx="8" ry="5" fill="#fff" opacity=".55" transform="rotate(-30 38 42)"/>`,
);
const GINGER = wrap(
  grad("gb", "#d9883f", "#8a4a1c"),
  `<circle cx="50" cy="24" r="15" fill="url(#gb)" stroke="${K}" stroke-width="3"/>
   <path d="M30 40 H70 Q84 40 84 50 Q84 58 72 56 L66 56 L72 86 Q73 94 64 92 L50 74 L36 92 Q27 94 28 86 L34 56 L28 56 Q16 58 16 50 Q16 40 30 40 Z" fill="url(#gb)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <g fill="${K}"><circle cx="44" cy="22" r="2.2"/><circle cx="56" cy="22" r="2.2"/></g>
   <path d="M44 29 Q50 33 56 29" stroke="${K}" stroke-width="2" fill="none" stroke-linecap="round"/>
   <path d="M22 48 Q25 52 22 55 M78 48 Q75 52 78 55 M34 84 Q38 82 40 86 M66 84 Q62 82 60 86" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
   <g fill="#d22b3a" stroke="#fff" stroke-width="1.5"><circle cx="50" cy="50" r="3.4"/><circle cx="50" cy="62" r="3.4"/></g>`,
);
const SLEIGH_BELL = wrap(
  GOLD + `<radialGradient id="sb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff4c2"/><stop offset=".55" stop-color="#d6a845"/><stop offset="1" stop-color="#7a5418"/></radialGradient>`,
  `<path d="M28 18 Q50 4 72 18" stroke="#2f7a3f" stroke-width="7" fill="none" stroke-linecap="round"/>
   <path d="M34 20 L44 30 M66 20 L56 30" stroke="#d22b3a" stroke-width="6" stroke-linecap="round"/>
   <circle cx="50" cy="60" r="30" fill="url(#sb)" stroke="${K}" stroke-width="3.5"/>
   <path d="M24 60 H76" stroke="${K}" stroke-width="3"/>
   <path d="M44 68 H56 M50 62 V76" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
   <circle cx="50" cy="80" r="3" fill="${K}"/>
   <ellipse cx="40" cy="45" rx="8" ry="5" fill="#fff" opacity=".55" transform="rotate(-25 40 45)"/>`,
);
const GIFT = wrap(
  GOLD + grad("box", "#e23b4a", "#8e1622"),
  `<rect x="16" y="40" width="68" height="50" rx="4" fill="url(#box)" stroke="${K}" stroke-width="3.5"/>
   <rect x="12" y="30" width="76" height="16" rx="3" fill="url(#box)" stroke="${K}" stroke-width="3.5"/>
   <rect x="44" y="30" width="12" height="60" fill="url(#g)" stroke="${K}" stroke-width="2.5"/>
   <path d="M50 30 C36 10 18 18 30 28 C36 32 46 31 50 30 C54 31 64 32 70 28 C82 18 64 10 50 30 Z" fill="url(#g)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M20 36 H40" stroke="#fff" stroke-width="2" opacity=".5"/>`,
);
const CRYSTAL = wrap(
  ICE + GOLD,
  `<g stroke="${K}" stroke-width="10" stroke-linecap="round">${[0, 60, 120].map((a) => `<path d="M50 12 V88" transform="rotate(${a} 50 50)"/>`).join("")}</g>
   <g stroke="url(#ice)" stroke-width="5.5" stroke-linecap="round" fill="none">${[0, 60, 120, 180, 240, 300]
     .map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 50 V13"/><path d="M50 26 L41 18 M50 26 L59 18"/></g>`)
     .join("")}</g>
   <circle cx="50" cy="50" r="9" fill="url(#g)" stroke="${K}" stroke-width="3"/>`,
);
const SNOWMAN = wrap(
  grad("sn", "#ffffff", "#bcd6ee") + GOLD,
  `<circle cx="50" cy="70" r="24" fill="url(#sn)" stroke="${K}" stroke-width="3.5"/>
   <circle cx="50" cy="38" r="17" fill="url(#sn)" stroke="${K}" stroke-width="3.5"/>
   <rect x="34" y="18" width="32" height="5" rx="2" fill="${K}"/><rect x="39" y="2" width="22" height="18" rx="2" fill="${K}"/><rect x="39" y="13" width="22" height="4" fill="url(#g)"/>
   <g fill="${K}"><circle cx="44" cy="35" r="2.3"/><circle cx="56" cy="35" r="2.3"/><circle cx="50" cy="64" r="2.4"/><circle cx="50" cy="74" r="2.4"/></g>
   <path d="M50 40 L62 43 L50 45 Z" fill="#f08a24" stroke="${K}" stroke-width="1.5" stroke-linejoin="round"/>
   <path d="M33 52 Q50 60 67 52 L69 58 Q50 66 31 58 Z" fill="#d22b3a" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M60 58 L66 76 L58 76 Z" fill="#d22b3a" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>`,
);
const GLOBE = wrap(
  GOLD + `<radialGradient id="gl" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#e8f6ff"/><stop offset=".7" stop-color="#7fb6e6"/><stop offset="1" stop-color="#2f5f96"/></radialGradient>`,
  `<path d="M22 78 H78 L84 94 H16 Z" fill="url(#g)" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"/>
   <circle cx="50" cy="46" r="34" fill="url(#gl)" stroke="${K}" stroke-width="3.5"/>
   <path d="M30 70 L40 52 L46 60 L54 44 L70 70 Z" fill="#1f5a3a" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M50 30 l1.8 4 4.2 0.6 -3 3 0.8 4.2 -3.8 -2 -3.8 2 0.8 -4.2 -3 -3 4.2 -0.6z" fill="#fff4c2"/>
   <g fill="#fff"><circle cx="30" cy="40" r="1.8"/><circle cx="66" cy="34" r="1.6"/><circle cx="62" cy="54" r="1.8"/><circle cx="38" cy="26" r="1.4"/></g>
   <path d="M30 24 Q38 16 50 14" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
);

export const WINTER_ART = art({ cherry: CANE, lemon: BAUBLE, grape: GINGER, bell: SLEIGH_BELL, gem: GIFT, seven: CRYSTAL, wild: SNOWMAN, scatter: GLOBE });
