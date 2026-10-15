import type { Skin } from "../lib/skins";
import type { Sym } from "../lib/slots";

/** Un symbole en petit (dans un texte, une table...) : dessin du thème, ou emoji en thème Classic. */
export default function Glyph({ sym, skin, className = "h-[1.25em] w-[1.25em]" }: { sym: Sym; skin: Skin; className?: string }) {
  if (!skin.art) return <span>{skin.emoji[sym]}</span>;
  return <img src={skin.art[sym]} alt="" draggable={false} className={`inline-block select-none align-[-0.3em] ${className}`} />;
}