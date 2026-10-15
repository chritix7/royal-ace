import type { Sym } from "./slots";

/**
 * Symboles dessinés à la main en SVG (style Miami années 80).
 * Chaque dessin est une image autonome : aucun fichier à ajouter au projet.
 */
const OUT = "#2a0b3f"; // contour sombre commun

const wrap = (defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`;
const grad = (id: string, a: string, b: string, vertical = true, mid?: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/>${
    mid ? `<stop offset=".5" stop-color="${mid}"/>` : ""
  }<stop offset="1" stop-color="${b}"/></linearGradient>`;

const PALM = wrap(
  grad("sun", "#ffe066", "#ff2e88") + grad("leaf", "#6ee7b7", "#047857") + grad("trunk", "#c28a2a", "#5b3a12", false) +
    `<clipPath id="c"><circle cx="50" cy="54" r="35"/></clipPath>`,
  `<circle cx="50" cy="54" r="35" fill="url(#sun)"/>
   <g clip-path="url(#c)" fill="#3b0a4a" opacity=".38"><rect x="10" y="64" width="80" height="3"/><rect x="10" y="72" width="80" height="4"/><rect x="10" y="81" width="80" height="5"/></g>
   <path d="M46 96 C44 78 49 62 55 46 L62 48 C58 62 56 78 59 96 Z" fill="url(#trunk)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M47 84 L58 85 M48 74 L58 75 M50 64 L59 65 M52 54 L60 55" stroke="${OUT}" stroke-width="1.6" opacity=".55"/>
   <g fill="url(#leaf)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">
     <path d="M58 46 C44 28 22 30 8 48 C26 42 42 44 58 46 Z"/>
     <path d="M58 46 C74 28 94 32 96 50 C80 42 70 44 58 46 Z"/>
     <path d="M58 46 C48 26 54 10 66 4 C62 20 63 34 58 46 Z"/>
     <path d="M58 46 C68 30 82 22 94 24 C84 34 72 40 58 46 Z"/>
     <path d="M58 46 C40 40 26 24 14 24 C28 34 44 42 58 46 Z"/>
   </g>
   <circle cx="55" cy="50" r="4.2" fill="#7c4a12" stroke="${OUT}" stroke-width="2"/><circle cx="63" cy="51" r="4.2" fill="#7c4a12" stroke="${OUT}" stroke-width="2"/>
   <path d="M20 94 Q35 88 50 94 T80 94" stroke="#22d3ee" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`
);

const COCKTAIL = wrap(
  grad("drink", "#ffb347", "#ff2e88") + grad("glass", "#e0f7ff", "#7dd3fc") + grad("orange", "#fdba74", "#f97316", false),
  `<path d="M16 22 L84 22 L54 58 L54 80 L68 86 L68 92 L32 92 L32 86 L46 80 L46 58 Z" fill="url(#glass)" fill-opacity=".45" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M22 28 L78 28 L52 58 L48 58 Z" fill="url(#drink)"/>
   <path d="M27 34 L73 34" stroke="#fff" stroke-width="2" opacity=".5"/>
   <path d="M60 46 L76 6" stroke="#22d3ee" stroke-width="5" stroke-linecap="round"/><path d="M60 46 L76 6" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/>
   <circle cx="20" cy="22" r="11" fill="url(#orange)" stroke="${OUT}" stroke-width="2.5"/><path d="M20 12 V32 M10 22 H30 M13 15 L27 29 M27 15 L13 29" stroke="#fff7ed" stroke-width="1.5" opacity=".8"/>
   <path d="M32 14 Q42 0 52 14 Z" fill="#ff4fa3" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 14 V30" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>
   <path d="M38 92 H62" stroke="#fff" stroke-width="2" opacity=".5"/>`
);

const SHADES = wrap(
  grad("lens", "#22d3ee", "#ff2e88", true, "#a78bfa") + grad("gold", "#fff3b0", "#d4a017"),
  `<path d="M6 36 C30 28 70 28 94 36" stroke="url(#gold)" stroke-width="4" fill="none" stroke-linecap="round"/>
   <path d="M6 36 L2 30 M94 36 L98 30" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
   <g stroke="url(#gold)" stroke-width="3.5" stroke-linejoin="round" fill="url(#lens)">
     <path d="M10 38 C10 34 15 33 21 33 L42 33 C47 33 49 37 48 43 C46 56 38 68 27 68 C15 68 8 54 10 38 Z"/>
     <path d="M90 38 C90 34 85 33 79 33 L58 33 C53 33 51 37 52 43 C54 56 62 68 73 68 C85 68 92 54 90 38 Z"/>
   </g>
   <path d="M47 40 Q50 35 53 40" stroke="url(#gold)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
   <g fill="#fff" opacity=".6"><path d="M16 40 L26 38 L14 54 Z"/><path d="M84 40 L74 38 L86 54 Z"/></g>
   <g stroke="${OUT}" stroke-width="1.6" fill="none" opacity=".5"><path d="M10 38 C10 34 15 33 21 33 L42 33 C47 33 49 37 48 43 C46 56 38 68 27 68 C15 68 8 54 10 38 Z"/><path d="M90 38 C90 34 85 33 79 33 L58 33 C53 33 51 37 52 43 C54 56 62 68 73 68 C85 68 92 54 90 38 Z"/></g>
   <path d="M62 14 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="#fff" opacity=".9"/>`
);

const BOAT = wrap(
  grad("hull", "#ffffff", "#ffb3d9") + grad("water", "#67e8f9", "#0891b2") + grad("glassb", "#bae6fd", "#38bdf8"),
  `<path d="M6 80 Q18 72 30 80 T54 80 T78 80 T94 80 Q99 92 82 97 H18 Q1 93 6 80 Z" fill="url(#water)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M2 66 Q10 58 18 64 M0 56 Q8 49 14 55" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
   <path d="M18 54 L82 46 C92 45 98 50 95 58 L84 76 L26 76 C18 76 14 68 18 54 Z" fill="url(#hull)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M20 58 L92 51 L88 59 L21 66 Z" fill="#22d3ee" stroke="${OUT}" stroke-width="2"/><path d="M24 69 L86 63" stroke="#ff2e88" stroke-width="3" stroke-linecap="round"/>
   <path d="M44 48 L52 30 L72 28 L78 46 Z" fill="url(#glassb)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M55 33 L68 32 M56 40 L72 39" stroke="#fff" stroke-width="2" opacity=".7"/>
   <path d="M28 52 V34" stroke="${OUT}" stroke-width="2.5"/><path d="M28 34 L40 38 L28 42 Z" fill="#ff4fa3" stroke="${OUT}" stroke-width="2"/>
   <path d="M6 82 Q12 88 22 84 M70 88 Q78 82 90 88" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`
);

const CAR = wrap(
  grad("body", "#ff7ac0", "#be123c") + grad("win", "#e0f2fe", "#38bdf8") + grad("glow", "#22d3ee", "#22d3ee00"),
  `<ellipse cx="50" cy="88" rx="44" ry="7" fill="url(#glow)" opacity=".55"/>
   <path d="M3 72 L5 62 L24 57 L44 44 L66 42 L86 52 L98 60 L98 73 L3 73 Z" fill="url(#body)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M30 57 L46 46 L65 44 L80 53 Z" fill="url(#win)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M58 45 L60 55" stroke="${OUT}" stroke-width="2.5"/>
   <path d="M8 64 L96 64" stroke="#fff" stroke-width="2.5" opacity=".75"/><path d="M12 68 H30 M70 68 H92" stroke="${OUT}" stroke-width="2" opacity=".5"/>
   <path d="M92 58 L98 60 L98 64 L90 63 Z" fill="#fde047" stroke="${OUT}" stroke-width="2"/><path d="M4 62 L10 58 L10 66 L4 66 Z" fill="#ef4444" stroke="${OUT}" stroke-width="2"/>
   <g stroke="${OUT}" stroke-width="3"><circle cx="27" cy="73" r="11" fill="#1f1235"/><circle cx="77" cy="73" r="11" fill="#1f1235"/></g>
   <g fill="#e5e7eb" stroke="${OUT}" stroke-width="1.5"><circle cx="27" cy="73" r="5.5"/><circle cx="77" cy="73" r="5.5"/></g>
   <path d="M14 52 L24 42 M40 46 L46 40" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`
);

const TIGER = wrap(
  grad("fur", "#fdba74", "#ea580c") + grad("eye", "#d9f99d", "#65a30d"),
  `<circle cx="20" cy="26" r="13" fill="#ea580c" stroke="${OUT}" stroke-width="3"/><circle cx="80" cy="26" r="13" fill="#ea580c" stroke="${OUT}" stroke-width="3"/>
   <circle cx="20" cy="26" r="6" fill="#ffb3d9"/><circle cx="80" cy="26" r="6" fill="#ffb3d9"/>
   <path d="M50 14 C80 14 94 36 92 58 C90 80 72 94 50 94 C28 94 10 80 8 58 C6 36 20 14 50 14 Z" fill="url(#fur)" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
   <g fill="${OUT}"><path d="M50 16 L46 36 L50 30 L54 36 Z"/><path d="M36 20 L38 36 L42 28 Z"/><path d="M64 20 L62 36 L58 28 Z"/>
     <path d="M9 52 L26 56 L10 62 Z"/><path d="M91 52 L74 56 L90 62 Z"/><path d="M13 70 L28 68 L16 78 Z"/><path d="M87 70 L72 68 L84 78 Z"/></g>
   <ellipse cx="50" cy="72" rx="22" ry="17" fill="#fff7ed" stroke="${OUT}" stroke-width="2.5"/>
   <g stroke="${OUT}" stroke-width="2.5"><path d="M24 46 Q34 40 44 48 Q34 56 24 46 Z" fill="url(#eye)"/><path d="M76 46 Q66 40 56 48 Q66 56 76 46 Z" fill="url(#eye)"/></g>
   <g fill="${OUT}"><ellipse cx="34" cy="48" rx="2.6" ry="4.4"/><ellipse cx="66" cy="48" rx="2.6" ry="4.4"/></g>
   <path d="M43 62 L57 62 L50 71 Z" fill="#ff4fa3" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M50 71 V77 M50 77 Q43 84 37 79 M50 77 Q57 84 63 79" stroke="${OUT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
   <path d="M36 70 L18 66 M36 74 L18 76 M64 70 L82 66 M64 74 L82 76" stroke="${OUT}" stroke-width="1.6" opacity=".7"/>`
);

const BOSS = wrap(
  grad("suit", "#ffffff", "#c7d2fe") + grad("skin", "#f2c08f", "#c98b55") + grad("shirt", "#ff7ac0", "#e11d74"),
  `<path d="M4 100 C4 76 24 68 50 68 C76 68 96 76 96 100 Z" fill="url(#suit)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M50 68 L36 100 M50 68 L64 100" stroke="${OUT}" stroke-width="2.5"/>
   <path d="M38 68 L50 94 L62 68 Z" fill="url(#shirt)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M40 72 Q50 86 60 72" stroke="#fde047" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="82" r="2.6" fill="#fde047" stroke="${OUT}" stroke-width="1.2"/>
   <path d="M30 100 L36 80 M70 100 L64 80" stroke="${OUT}" stroke-width="1.6" opacity=".35"/>
   <rect x="43" y="56" width="14" height="14" rx="4" fill="url(#skin)" stroke="${OUT}" stroke-width="2.5"/>
   <ellipse cx="50" cy="40" rx="19" ry="22" fill="url(#skin)" stroke="${OUT}" stroke-width="3"/>
   <path d="M30 38 C28 16 44 10 54 12 C70 12 74 26 70 38 C66 28 58 24 50 24 C42 24 34 28 30 38 Z" fill="#1c1325" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M33 38 L67 38 L65 48 C62 51 58 50 56 47 L52 43 H48 L44 47 C42 50 38 51 35 48 Z" fill="#150d1f" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M37 40 L46 40 L40 46 Z M54 40 L63 40 L57 46 Z" fill="#22d3ee" opacity=".85"/>
   <path d="M42 56 Q50 60 58 55" stroke="${OUT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
   <path d="M55 56 L76 62" stroke="#7c4a12" stroke-width="4.5" stroke-linecap="round"/><path d="M75 61.4 L79 62.8" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round"/>
   <path d="M82 54 q3 -5 0 -9 M86 56 q3 -5 0 -9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`
);

const GLOBE = wrap(
  `<radialGradient id="sea" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#7dd3fc"/><stop offset=".6" stop-color="#2563eb"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient>` +
    grad("land", "#86efac", "#16a34a") + `<clipPath id="g"><circle cx="50" cy="50" r="32"/></clipPath>`,
  `<circle cx="50" cy="50" r="32" fill="url(#sea)" stroke="${OUT}" stroke-width="3"/>
   <g clip-path="url(#g)" fill="url(#land)" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round">
     <path d="M26 30 C34 22 46 24 48 32 C46 40 40 44 36 52 C30 50 22 40 26 30 Z"/>
     <path d="M54 38 C64 30 78 36 80 46 C78 58 70 66 62 76 C56 68 58 56 52 50 C50 44 50 40 54 38 Z"/>
   </g>
   <g clip-path="url(#g)" stroke="#fff" stroke-width="1.2" fill="none" opacity=".35"><ellipse cx="50" cy="50" rx="14" ry="32"/><path d="M18 50 H82 M22 34 H78 M22 66 H78"/></g>
   <path d="M30 34 C34 28 40 26 46 26" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>
   <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#ff4fa3" stroke-width="4" transform="rotate(-18 50 52)" stroke-dasharray="0" opacity=".95"/>
   <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="${OUT}" stroke-width="1.4" transform="rotate(-18 50 52)" opacity=".6"/>
   <path d="M82 14 l2.6 7 7 2.6 -7 2.6 -2.6 7 -2.6 -7 -7 -2.6 7 -2.6 z" fill="#fde047" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`
);

/** Les 8 symboles du thème Miami. */
export const MIAMI_SVG: Record<Sym, string> = {
  cherry: PALM,
  lemon: COCKTAIL,
  grape: SHADES,
  bell: BOAT,
  gem: CAR,
  seven: TIGER,
  wild: BOSS,
  scatter: GLOBE,
};

/** Adresse "data:" utilisable directement dans <img src>. */
const toSrc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
export const MIAMI_ART = Object.fromEntries(
  (Object.keys(MIAMI_SVG) as Sym[]).map((s) => [s, toSrc(MIAMI_SVG[s])])
) as Record<Sym, string>;

/** Mallette du bonus « coffre ». */
const CASE_SVG = wrap(
  grad("lea", "#9a6422", "#3b2209") + grad("gold", "#fff3b0", "#c28a2a"),
  `<path d="M36 30 V20 Q36 13 43 13 H57 Q64 13 64 20 V30" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>
   <path d="M36 30 V20 Q36 13 43 13 H57 Q64 13 64 20 V30" fill="none" stroke="url(#gold)" stroke-width="4.5" stroke-linecap="round"/>
   <rect x="8" y="28" width="84" height="60" rx="9" fill="url(#lea)" stroke="${OUT}" stroke-width="3"/>
   <path d="M8 52 H92" stroke="${OUT}" stroke-width="3" opacity=".7"/><path d="M14 36 H86" stroke="#fff" stroke-width="2" opacity=".18"/>
   <rect x="43" y="46" width="14" height="16" rx="3" fill="url(#gold)" stroke="${OUT}" stroke-width="2.4"/><circle cx="50" cy="54" r="2.2" fill="${OUT}"/>
   <rect x="17" y="44" width="11" height="14" rx="2.5" fill="url(#gold)" stroke="${OUT}" stroke-width="2.2"/><rect x="72" y="44" width="11" height="14" rx="2.5" fill="url(#gold)" stroke="${OUT}" stroke-width="2.2"/>
   <g fill="url(#gold)" stroke="${OUT}" stroke-width="1.8"><rect x="8" y="28" width="10" height="10" rx="3"/><rect x="82" y="28" width="10" height="10" rx="3"/><rect x="8" y="78" width="10" height="10" rx="3"/><rect x="82" y="78" width="10" height="10" rx="3"/></g>`
);
export const CASE_ART = toSrc(CASE_SVG);