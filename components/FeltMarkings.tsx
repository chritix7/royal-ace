"use client";

import { useId } from "react";
import { translateText, useLang } from "../lib/i18n";

/**
 * The house rules printed on the felt as one curved line, the way a
 * real table carries "BLACKJACK PAYS 3 TO 2" on an arc. Drawn as SVG
 * text on a shallow curve that follows the table's rounded bottom
 * edge. Positioning comes from the caller via `className`.
 */
export default function FeltMarkings({
  bj65,
  h17,
  className = "",
}: {
  bj65: boolean;
  h17: boolean;
  className?: string;
}) {
  const id = useId();
  const fr = useLang() === "fr";
  const line = [
    `Blackjack pays ${bj65 ? "6 to 5" : "3 to 2"}`,
    "Insurance pays 2 to 1",
    `Dealer ${h17 ? "hits" : "stands on"} soft 17`,
  ].map((t) => (fr ? translateText(t) : t)).join("   ❖   ").toUpperCase();

  return (
    <svg
      aria-hidden="true"
      translate="no"
      viewBox="0 0 680 30"
      className={`pointer-events-none h-[30px] w-[min(92%,680px)] ${className}`}
    >
      <defs>
        {/* Ends sit 11 units above the centre: a gentle "smile". */}
        <path id={id} d="M 12 9 Q 340 31 668 9" fill="none" />
      </defs>
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
        fill="rgba(229,199,121,0.42)"
        style={{ textShadow: "0 1px 0 rgba(0,0,0,0.9)" }}
      >
        <textPath href={`#${id}`} startOffset="50%" textLength="628" lengthAdjust="spacing">
          {line}
        </textPath>
      </text>
    </svg>
  );
}
