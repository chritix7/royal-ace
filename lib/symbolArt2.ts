import type { Sym } from "./slots";

/**
 * Symbols of Royal Ace Gold and Pharaoh's Vault, drawn in SVG (data: URIs,
 * nothing to download). Kept simple on purpose: flat shapes, two or three
 * gradients each, no filters — light to paint, even on phones.
 */
const wrap = (defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`;
const grad = (id: string, a: string, b: string, mid?: string, horizontal = false) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="${a}"/>${
    mid ? `<stop offset=".5" stop-color="${mid}"/>` : ""
  }<stop offset="1" stop-color="${b}"/></linearGradient>`;
const toSrc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const art = (m: Record<Sym, string>) => Object.fromEntries((Object.keys(m) as Sym[]).map((s) => [s, toSrc(m[s])])) as Record<Sym, string>;

/* ───────── Royal Ace Gold: black lacquer, gold and ivory ───────── */
const K = "#1a1206"; // outline
const GOLD = grad("g", "#fff4c2", "#a87a2c", "#e6bd5c");
const GOLD_H = grad("gh", "#a87a2c", "#a87a2c", "#fff4c2", true);

const CHAMPAGNE = wrap(
  GOLD + grad("wine", "#fff7d6", "#e9c46a") + grad("bot", "#2b3a2a", "#0b120b"),
  `<path d="M60 92 V44 Q60 34 66 28 V12 H78 V28 Q84 34 84 44 V92 Z" fill="url(#bot)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <rect x="64" y="6" width="16" height="12" rx="3" fill="url(#g)" stroke="${K}" stroke-width="2.5"/>
   <rect x="62" y="54" width="20" height="22" rx="2" fill="url(#g)" stroke="${K}" stroke-width="2"/>
   <text x="72" y="69" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="9" fill="${K}">RA</text>
   <path d="M18 14 H50 L46 46 Q34 58 22 46 Z" fill="url(#wine)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M20 22 H48" stroke="#fff" stroke-width="2" opacity=".7"/>
   <g fill="#fff" opacity=".85"><circle cx="30" cy="34" r="1.6"/><circle cx="38" cy="28" r="1.3"/><circle cx="34" cy="42" r="1.4"/></g>
   <rect x="31.5" y="54" width="5" height="28" fill="url(#g)" stroke="${K}" stroke-width="2"/>
   <ellipse cx="34" cy="86" rx="15" ry="5" fill="url(#g)" stroke="${K}" stroke-width="3"/>`,
);
const RING = wrap(
  GOLD + grad("dia", "#e6fbff", "#7fd3ef"),
  `<circle cx="50" cy="62" r="26" fill="none" stroke="${K}" stroke-width="13"/><circle cx="50" cy="62" r="26" fill="none" stroke="url(#g)" stroke-width="8"/>
   <path d="M30 52 Q50 40 70 52" stroke="#fff" stroke-width="2" fill="none" opacity=".55"/>
   <path d="M38 30 L44 20 H56 L62 30 L50 44 Z" fill="url(#dia)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M38 30 H62 M44 20 L50 30 L56 20 M50 30 V44" stroke="${K}" stroke-width="1.5" opacity=".6"/>
   <path d="M47 24 L50 28" stroke="#fff" stroke-width="2"/>`,
);
const WATCH = wrap(
  GOLD + grad("face", "#fffaf0", "#e8dcc0"),
  `<path d="M50 6 V14" stroke="${K}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="8" r="5" fill="none" stroke="url(#g)" stroke-width="3"/>
   <rect x="44" y="12" width="12" height="8" rx="2" fill="url(#g)" stroke="${K}" stroke-width="2.5"/>
   <circle cx="50" cy="56" r="36" fill="url(#g)" stroke="${K}" stroke-width="3"/>
   <circle cx="50" cy="56" r="28" fill="url(#face)" stroke="${K}" stroke-width="2.5"/>
   <g stroke="${K}" stroke-width="2.5" stroke-linecap="round"><path d="M50 32 V37 M50 75 V80 M26 56 H31 M69 56 H74"/></g>
   <path d="M50 56 L50 40 M50 56 L62 62" stroke="${K}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="56" r="3" fill="${K}"/>
   <path d="M30 40 Q38 28 52 28" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`,
);
const BARS = wrap(
  GOLD + GOLD_H,
  `<g stroke="${K}" stroke-width="3" stroke-linejoin="round">
     <path d="M10 82 L18 64 H48 L56 82 Z" fill="url(#g)"/><path d="M44 82 L52 64 H82 L90 82 Z" fill="url(#g)"/>
     <path d="M27 60 L35 42 H65 L73 60 Z" fill="url(#gh)"/>
   </g>
   <g fill="#fff" opacity=".6"><path d="M20 68 H44 L45 70 H19 Z"/><path d="M54 68 H78 L79 70 H53 Z"/><path d="M37 46 H61 L62 48 H36 Z"/></g>
   <text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="9" fill="${K}" opacity=".7">999.9</text>
   <path d="M82 22 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff4c2"/>`,
);
const DIAMOND = wrap(
  grad("d1", "#ffffff", "#9fe3f7") + grad("d2", "#c6f1fb", "#3fb6dd") + grad("d3", "#e9fbff", "#71cbe8"),
  `<path d="M14 36 L30 16 H70 L86 36 L50 88 Z" fill="url(#d2)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M14 36 H86 L50 88 Z" fill="url(#d3)"/><path d="M30 16 L40 36 L50 16 L60 36 L70 16" fill="url(#d1)" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
   <path d="M14 36 H86 M40 36 L50 88 L60 36" stroke="${K}" stroke-width="2" fill="none" opacity=".55"/>
   <path d="M24 34 L32 22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
   <path d="M80 10 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff"/>`,
);
const CROWN = wrap(
  GOLD + grad("ruby", "#ff8a9a", "#a3122a"),
  `<path d="M12 74 L8 30 L30 50 L50 18 L70 50 L92 30 L88 74 Z" fill="url(#g)" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"/>
   <rect x="12" y="72" width="76" height="14" rx="3" fill="url(#g)" stroke="${K}" stroke-width="3.5"/>
   <g stroke="${K}" stroke-width="2"><circle cx="8" cy="28" r="5" fill="url(#g)"/><circle cx="50" cy="16" r="5" fill="url(#g)"/><circle cx="92" cy="28" r="5" fill="url(#g)"/></g>
   <g stroke="${K}" stroke-width="2"><circle cx="30" cy="79" r="4" fill="url(#ruby)"/><circle cx="50" cy="79" r="4.5" fill="#3fb6dd"/><circle cx="70" cy="79" r="4" fill="url(#ruby)"/></g>
   <path d="M24 64 Q50 56 76 64" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/>`,
);
const ACE_WILD = wrap(
  GOLD + grad("card", "#1d1a14", "#0b0906"),
  `<rect x="18" y="8" width="64" height="84" rx="9" fill="url(#card)" stroke="url(#g)" stroke-width="4"/>
   <rect x="24" y="14" width="52" height="72" rx="5" fill="none" stroke="url(#g)" stroke-width="1.2" opacity=".6"/>
   <path d="M50 24 C40 36 28 42 28 54 C28 63 38 67 46 61 L42 74 H58 L54 61 C62 67 72 63 72 54 C72 42 60 36 50 24 Z" fill="url(#g)" stroke="${K}" stroke-width="2"/>
   <text x="29" y="27" font-family="Georgia,serif" font-weight="700" font-size="13" fill="#f3d98f">A</text>`,
);
const SEAL = wrap(
  GOLD + grad("rim", "#8a6420", "#f6dd94", "#c9993f"),
  `<g fill="url(#rim)" stroke="${K}" stroke-width="2.5">${Array.from({ length: 16 }, (_, i) => `<circle cx="${50 + 38 * Math.cos((i * Math.PI) / 8)}" cy="${50 + 38 * Math.sin((i * Math.PI) / 8)}" r="7"/>`).join("")}</g>
   <circle cx="50" cy="50" r="38" fill="url(#g)" stroke="${K}" stroke-width="3"/>
   <circle cx="50" cy="50" r="29" fill="#120d05" stroke="url(#rim)" stroke-width="2.5"/>
   <text x="50" y="58" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="24" fill="#f3d98f">RA</text>
   <path d="M33 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#fff4c2"/>`,
);
export const GOLD_ART = art({ cherry: CHAMPAGNE, lemon: RING, grape: WATCH, bell: BARS, gem: DIAMOND, seven: CROWN, wild: ACE_WILD, scatter: SEAL });

/* ───────── Pharaoh's Vault: sandstone, lapis and gold ───────── */
const D = "#24160a";
const LAPIS = grad("l", "#5a8cff", "#14307a");
const SAND = grad("s", "#f3d9a4", "#b9894a");

const ANKH = wrap(
  GOLD,
  `<path d="M50 10 C36 10 32 24 34 34 C36 42 44 48 46 50 H24 V60 H45 V92 H55 V60 H76 V50 H54 C56 48 64 42 66 34 C68 24 64 10 50 10 Z M50 20 C57 20 58 28 56 34 C55 38 52 42 50 44 C48 42 45 38 44 34 C42 28 43 20 50 20 Z" fill="url(#g)" stroke="${D}" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd"/>
   <path d="M40 54 H70" stroke="#fff" stroke-width="2" opacity=".5"/>`,
);
const LOTUS = wrap(
  grad("p", "#ffd6e8", "#d9658f") + grad("lf", "#6fd3a5", "#1d6b4a"),
  `<path d="M8 74 Q50 98 92 74 Q50 84 8 74 Z" fill="url(#lf)" stroke="${D}" stroke-width="2.5"/>
   <g fill="url(#p)" stroke="${D}" stroke-width="2.5" stroke-linejoin="round">
     <path d="M50 78 C30 72 18 54 22 36 C36 44 46 58 50 78 Z"/><path d="M50 78 C70 72 82 54 78 36 C64 44 54 58 50 78 Z"/>
     <path d="M50 78 C38 62 38 34 50 14 C62 34 62 62 50 78 Z"/>
   </g>
   <path d="M50 22 V64" stroke="#fff" stroke-width="2" opacity=".5"/>`,
);
const EYE = wrap(
  LAPIS + GOLD,
  `<path d="M8 46 Q50 14 92 46 Q50 70 8 46 Z" fill="#f6ecd4" stroke="${D}" stroke-width="4" stroke-linejoin="round"/>
   <circle cx="50" cy="45" r="13" fill="url(#l)" stroke="${D}" stroke-width="3"/><circle cx="50" cy="45" r="5" fill="${D}"/><circle cx="46" cy="41" r="2.5" fill="#fff"/>
   <path d="M10 30 Q50 6 90 30" stroke="url(#l)" stroke-width="6" fill="none" stroke-linecap="round"/>
   <path d="M44 60 L40 88 Q34 94 28 86" stroke="url(#l)" stroke-width="6" fill="none" stroke-linecap="round"/>
   <path d="M60 58 Q70 72 82 70 Q90 64 84 56" stroke="url(#l)" stroke-width="6" fill="none" stroke-linecap="round"/>`,
);
const SCARAB = wrap(
  LAPIS + GOLD,
  `<g stroke="${D}" stroke-width="3" stroke-linejoin="round">
     <path d="M50 34 C30 30 10 40 6 58 C24 54 38 52 48 56 Z" fill="url(#g)"/><path d="M50 34 C70 30 90 40 94 58 C76 54 62 52 52 56 Z" fill="url(#g)"/>
     <ellipse cx="50" cy="62" rx="17" ry="24" fill="url(#l)"/><path d="M38 40 Q50 30 62 40 L58 46 H42 Z" fill="url(#g)"/>
     <circle cx="50" cy="20" r="11" fill="#ffb347"/>
   </g>
   <path d="M50 44 V86" stroke="${D}" stroke-width="2.5"/><path d="M42 56 Q46 52 48 58" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
   <g stroke="${D}" stroke-width="3" stroke-linecap="round"><path d="M34 70 L24 78 M66 70 L76 78 M34 80 L28 90 M66 80 L72 90"/></g>`,
);
const PYRAMID = wrap(
  SAND + grad("sh", "#c9965a", "#7a5226") + grad("sky", "#ffcf6a", "#ff8a3d"),
  `<circle cx="74" cy="24" r="12" fill="url(#sky)"/>
   <path d="M6 86 L50 16 L94 86 Z" fill="url(#s)" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M50 16 L94 86 H58 Z" fill="url(#sh)"/>
   <path d="M43 27 H57 M36 38 H64 M29 49 H71 M22 60 H78 M15 71 H85" stroke="${D}" stroke-width="1.5" opacity=".35"/>
   <path d="M44 26 L50 16 L56 26 Z" fill="#ffe08a" stroke="${D}" stroke-width="2"/>
   <path d="M2 88 H98" stroke="${D}" stroke-width="3" stroke-linecap="round"/>`,
);
const CAT = wrap(
  GOLD + grad("ob", "#2c2a35", "#0a0a10"),
  `<path d="M34 92 C26 72 30 52 38 40 L34 12 L46 30 H54 L66 12 L62 40 C70 52 74 72 66 92 Z" fill="url(#ob)" stroke="url(#g)" stroke-width="3" stroke-linejoin="round"/>
   <g fill="#7cf2c9"><path d="M40 38 Q44 34 47 38 Q44 41 40 38 Z"/><path d="M53 38 Q56 34 60 38 Q56 41 53 38 Z"/></g>
   <path d="M48 46 L52 46 L50 49 Z" fill="url(#g)"/>
   <path d="M36 60 Q50 68 64 60" stroke="url(#g)" stroke-width="4" fill="none"/><circle cx="50" cy="66" r="4" fill="url(#g)" stroke="${D}" stroke-width="1.5"/>
   <path d="M50 4 V10" stroke="url(#g)" stroke-width="3"/><circle cx="50" cy="4" r="3" fill="url(#g)"/>`,
);
const MASK = wrap(
  GOLD + LAPIS,
  `<path d="M14 40 C14 16 32 6 50 6 C68 6 86 16 86 40 L92 92 H8 Z" fill="url(#l)" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>
   <g stroke="url(#g)" stroke-width="4.5" fill="none"><path d="M14 52 L10 88"/><path d="M86 52 L90 88"/><path d="M18 40 L12 80"/><path d="M82 40 L88 80"/></g>
   <path d="M28 34 C28 22 38 16 50 16 C62 16 72 22 72 34 L72 66 C72 80 62 88 50 88 C38 88 28 80 28 66 Z" fill="url(#g)" stroke="${D}" stroke-width="3"/>
   <path d="M34 44 Q40 40 46 44 M54 44 Q60 40 66 44" stroke="${D}" stroke-width="3" fill="none" stroke-linecap="round"/>
   <path d="M33 48 Q40 52 46 48 M54 48 Q60 52 67 48" stroke="url(#l)" stroke-width="3" fill="none"/>
   <path d="M47 50 V64 H53" stroke="${D}" stroke-width="2.5" fill="none"/><path d="M42 72 Q50 76 58 72" stroke="${D}" stroke-width="2.5" fill="none"/>
   <path d="M46 88 V98 H54 V88" fill="url(#g)" stroke="${D}" stroke-width="2"/>
   <path d="M44 6 L50 0 L56 6" fill="url(#g)" stroke="${D}" stroke-width="2"/>`,
);
const SUN = wrap(
  grad("sun", "#fff3b0", "#ff9a3c") + GOLD,
  `<g fill="url(#g)" stroke="${D}" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 50 50)" d="M46 14 L50 2 L54 14 Z"/>`).join("")}</g>
   <circle cx="50" cy="50" r="30" fill="url(#sun)" stroke="${D}" stroke-width="3"/>
   <path d="M22 50 Q8 40 4 30 Q16 34 26 42 M78 50 Q92 40 96 30 Q84 34 74 42" fill="url(#g)" stroke="${D}" stroke-width="2"/>
   <path d="M38 52 Q50 40 62 52 Q50 62 38 52 Z" fill="#f6ecd4" stroke="${D}" stroke-width="2.5"/><circle cx="50" cy="52" r="4.5" fill="${D}"/>
   <path d="M34 36 Q42 28 54 30" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`,
);
export const PHARAOH_ART = art({ cherry: ANKH, lemon: LOTUS, grape: EYE, bell: SCARAB, gem: PYRAMID, seven: CAT, wild: MASK, scatter: SUN });
