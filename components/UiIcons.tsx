/** Crisp line icons for the casino interface (header, tabs, sound bar). */
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconMusic = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </svg>
);
export const IconSound = ({ className = "h-4 w-4", muted = false }: { className?: string; muted?: boolean }) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
    {muted ? (
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    )}
  </svg>
);
export const IconVibrate = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="8" y="4" width="8" height="16" rx="1.8" />
    <path d="M4.5 9v6M2 10.5v3M19.5 9v6M22 10.5v3" />
  </svg>
);
export const IconFocus = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
  </svg>
);
export const IconSpade = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M12 2.5c3.6 4.2 8 6.9 8 10.6a4.3 4.3 0 0 1-7.1 3.3c.3 1.8 1.1 3.3 2.5 4.6H8.6c1.4-1.3 2.2-2.8 2.5-4.6A4.3 4.3 0 0 1 4 13.1c0-3.7 4.4-6.4 8-10.6z" />
  </svg>
);
export const IconSlot = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="3" y="5" width="15" height="14" rx="2.2" />
    <path d="M8 5v14M13 5v14" />
    <path d="M18 10h1.8a1.2 1.2 0 0 0 1.2-1.2V6" />
    <circle cx="21" cy="5" r="1.2" />
  </svg>
);
export const IconRoulette = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
  </svg>
);
export const IconPoker = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="10" height="14.5" rx="1.6" transform="rotate(-12 8.5 12)" />
    <rect x="10" y="4" width="10" height="14.5" rx="1.6" transform="rotate(10 15 11)" />
    <path d="M15.6 9.2c.9 1 2 1.7 2 2.7a1.1 1.1 0 0 1-1.9.8l.3 1.3h-1.6l.4-1.3a1.1 1.1 0 0 1-1.9-.8c0-1 1.1-1.7 2-2.7z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconDice = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="2.5" y="8" width="11" height="11" rx="2.2" />
    <path d="M10.5 4.6l6.7-1.6a2 2 0 0 1 2.4 1.5l1.6 6.7a2 2 0 0 1-1.5 2.4l-3.2.8" />
    <circle cx="5.6" cy="11.1" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10.4" cy="15.9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="16.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="18" cy="9.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
export const IconBall = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.2l3.3 2.4-1.3 3.9h-4l-1.3-3.9z" fill="currentColor" stroke="none" />
    <path d="M12 8.2V3.5M15.3 10.6l4.4-1.5M14 14.5l2.7 3.8M10 14.5l-2.7 3.8M8.7 10.6L4.3 9.1" />
  </svg>
);
export const IconTicket = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 6.5h16v3.2a2.3 2.3 0 0 0 0 4.6v3.2H4v-3.2a2.3 2.3 0 0 0 0-4.6z" />
    <path d="M9.5 6.5v11" strokeDasharray="1.6 1.6" />
    <path d="M12.5 10h4.5M12.5 14h3" />
  </svg>
);
export const IconHome = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M3.5 10.5 12 4l8.5 6.5" />
    <path d="M5.5 9v10.5h13V9" />
    <path d="M10 19.5v-5.5h4v5.5" />
  </svg>
);
