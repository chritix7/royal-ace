"use client";

import { useEffect, useRef, useState } from "react";
import { BRAG_URL, bragCard, bragText, type Brag } from "../lib/brag";
import { useLang } from "../lib/i18n";
import { useProfile } from "../lib/profile";

/**
 * After a big win, once the celebration is over: a small card offering to
 * share it (picture + link). Native share sheet on phones; on computers,
 * the text and link are copied and the picture is downloaded.
 */
export default function BragPrompt() {
  const fr = useLang() === "fr";
  const profile = useProfile();
  const [b, setB] = useState<Brag | null>(null);
  const [msg, setMsg] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<Brag>).detail;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [
        window.setTimeout(() => {
          setMsg("");
          setB(d);
        }, 2600),
        window.setTimeout(() => setB(null), 2600 + 12000),
      ];
    };
    window.addEventListener("royal-ace:brag", on);
    return () => window.removeEventListener("royal-ace:brag", on);
  }, []);
  if (!b) return null;
  const text = bragText(b, fr);
  const share = async () => {
    let file: File | null = null;
    try {
      const blob = await bragCard(b, profile.name);
      file = new File([blob], "royal-ace-big-win.png", { type: "image/png" });
    } catch {}
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (file && nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: `${text} ${BRAG_URL}` });
        setB(null);
        return;
      }
      if (nav.share && matchMedia("(pointer: coarse)").matches) {
        await nav.share({ text, url: BRAG_URL });
        setB(null);
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    // Computers: copy the text, download the picture.
    try {
      await navigator.clipboard.writeText(`${text} ${BRAG_URL}`);
    } catch {}
    if (file) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    setMsg(fr ? "Texte copié, image téléchargée : colle-les où tu veux !" : "Text copied, picture downloaded: paste them anywhere!");
  };
  return (
    <div className="brag" role="dialog" aria-label={fr ? "Partager ton gain" : "Share your win"} translate="no">
      <button type="button" className="brag__x" onClick={() => setB(null)} aria-label={fr ? "Fermer" : "Close"}>
        ×
      </button>
      <p className="brag__k">{b.jackpot ? "JACKPOT" : "BIG WIN"}</p>
      <p className="brag__v">◈ {Math.round(b.amount).toLocaleString("en-US")}</p>
      <p className="brag__t">{msg || (fr ? "Montre-le à tes amis !" : "Show your friends!")}</p>
      {!msg && (
        <button type="button" className="pr-btn is-sm brag__go" onClick={share}>
          {fr ? "Partager" : "Share"} ↗
        </button>
      )}
    </div>
  );
}
