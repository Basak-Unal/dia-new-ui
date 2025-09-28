import React, { useId } from "react";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  rangeLow?: number;
  rangeHigh?: number;
  lineClassName?: string;
  axisClassName?: string;
  className?: string;
  yTicks?: number[];
};

export default function Sparkline({
  data,
  width = 340,
  height = 88,
  strokeWidth = 2.5,
  rangeLow = 70,
  rangeHigh = 180,
  lineClassName = "",
  axisClassName = "",
  className = "",
  yTicks,
}: Props) {
  if (!data || data.length < 2) return null;

  const dMin = Math.min(...data, rangeLow);
  const dMax = Math.max(...data, rangeHigh);
  const padTop = 10, padBottom = 14, padLeft = 42, padRight = 10;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const range = Math.max(1, dMax - dMin);

  const valToY = (v: number) =>
    padTop + (1 - (v - dMin) / range) * innerH;

  const stepX = innerW / (data.length - 1);
  const pts = data.map((v, i) => [padLeft + i * stepX, valToY(v)] as const);
  const d = pts.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(" ");
  const area = `${d} L ${padLeft + innerW} ${padTop + innerH} L ${padLeft} ${padTop + innerH} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  const bandTop = valToY(Math.min(rangeHigh, dMax));
  const bandBot = valToY(Math.max(rangeLow, dMin));
  const bandY = Math.min(bandTop, bandBot);
  const bandH = Math.max(0, Math.abs(bandBot - bandTop));

  const uniqueId = useId();
  const clipAboveLow = `clip-above-low-${uniqueId}`;
  const clipBelowLow = `clip-below-low-${uniqueId}`;

  const yLow = valToY(rangeLow);
  const bottom = padTop + innerH;

  const uniqueSorted = (arr: number[]) =>
    Array.from(new Set(arr.map(x => Math.round(x)))).sort((a, b) => a - b);

  let ticks: number[];
  if (yTicks && yTicks.length) {
    ticks = uniqueSorted(yTicks.filter(v => v >= dMin && v <= dMax));
  } else {
    const span = dMax - dMin;
    const step = span > 200 ? 50 : span > 160 ? 40 : span > 120 ? 25 : span > 80 ? 20 : 10;
    const start = Math.floor(dMin / step) * step;
    const end = Math.ceil(dMax / step) * step;
    const grid: number[] = [];
    for (let v = start; v <= end; v += step) grid.push(v);
    ticks = uniqueSorted([...grid, rangeLow, rangeHigh]);
    while (ticks.length > 5) ticks = ticks.filter((_, i) => i % 2 === 0);
  }

  const fmt = (v: number) => `${v}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img">
      {/* Clip regions to split area fill at the low threshold */}
      <defs>
        <clipPath id={clipAboveLow}>
          <rect x={padLeft} y={padTop} width={innerW} height={Math.max(0, yLow - padTop)} />
        </clipPath>
        <clipPath id={clipBelowLow}>
          <rect x={padLeft} y={yLow} width={innerW} height={Math.max(0, bottom - yLow)} />
        </clipPath>
      </defs>

      {/* GRID + LABELS */}
      <g className={axisClassName}>
        <line
          x1={padLeft} x2={padLeft + innerW}
          y1={padTop + innerH} y2={padTop + innerH}
          stroke="red" opacity="0.18" strokeWidth="1"
        />
        {ticks.map(v => {
          const y = valToY(v);
          return (
            <g key={v}>
              <line
                x1={padLeft} x2={padLeft + innerW}
                y1={y} y2={y}
                stroke="currentColor" opacity="0.10" strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
                opacity="0.7"
                className="select-none"
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}
      </g>

      {/* IN-RANGE BAND */}
      {bandH > 0 && (
        <rect
          className={lineClassName}
          x={padLeft}
          y={bandY}
          width={innerW}
          height={bandH}
          fill="currentColor"
          opacity="0.08"
          rx="6"
        />
      )}

      {/* AREA SPLIT: green between low line and curve, red below low */}
      <g>
        <path d={area} fill="green" opacity="0.10" clipPath={`url(#${clipAboveLow})`} />
        <path d={area} fill="red" opacity="0.10" clipPath={`url(#${clipBelowLow})`} />
      </g>

      {/* LINE + DOT */}
      <g className={lineClassName}>
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r={3} fill="currentColor" />
      </g>
    </svg>
  );
}
