/**
 * Tiny inline sparkline — a condensed version of the big Spark in
 * ui.tsx. One stroke, no labels, tone follows whether the last value
 * is above or below the first. Used in the Session "Today" card so
 * the net direction is visible as a shape, not just a number.
 */
export default function MiniSpark({
  data,
  height = 26,
}: {
  data: number[];
  height?: number;
}) {
  // Placeholder when the session has one or zero data points.
  if (data.length < 2) {
    return (
      <div
        className="w-full rounded-md bg-white/[0.03]"
        style={{ height }}
        aria-hidden
      />
    );
  }

  const W = 120;
  const H = height;
  const PAD = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const linePts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPts =
    linePts + ` ${W},${H} 0,${H}`;

  const diff = data[data.length - 1] - data[0];
  const color = diff > 0 ? "#5ad48c" : diff < 0 ? "#f87171" : "#e5c779";
  const fillId = `mini-spark-fill-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      style={{ height }}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Session trend ${diff >= 0 ? "up" : "down"}`}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${fillId})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current-value dot */}
      <circle
        cx={W}
        cy={
          H -
          PAD -
          ((data[data.length - 1] - min) / range) * (H - PAD * 2)
        }
        r="1.8"
        fill={color}
      />
    </svg>
  );
}
