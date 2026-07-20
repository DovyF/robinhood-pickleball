"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

/** Lightweight dependency-free SVG area chart with hover tooltip. */
export function SalesChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 720;
  const h = 240;
  const pad = { top: 16, right: 12, bottom: 24, left: 44 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.revenue));

  const x = (i: number) => pad.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / max) * ih;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(pad.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + ih).toFixed(1)} Z`;

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-2xl font-extrabold">{formatMoney(total)}</span>
        <span className="text-sm text-ink-soft">total revenue</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14532d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={pad.top + ih * t} y2={pad.top + ih * t} stroke="#efece2" />
            <text x={pad.left - 8} y={pad.top + ih * t + 4} textAnchor="end" fontSize="10" fill="#8a978f">
              {formatMoney(max * (1 - t)).replace(".00", "")}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#rev)" />
        <path d={line} fill="none" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <rect key={i} x={x(i) - iw / (data.length * 2)} y={pad.top} width={iw / data.length} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} stroke="#14532d" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={x(hover)} cy={y(data[hover].revenue)} r="4" fill="#14532d" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <p className="text-center text-sm text-ink-soft">
          <strong className="text-ink">{data[hover].date}</strong> · {formatMoney(data[hover].revenue)} · {data[hover].orders} orders
        </p>
      )}
    </div>
  );
}
