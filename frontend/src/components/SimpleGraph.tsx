import React, { useState, useRef } from "react";

export interface DataPoint {
  date: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  event?: {
    title: string;
    title_mr?: string;
    description: string;
    description_mr?: string;
    type: "warning" | "success" | "info";
  };
}

export interface SimpleGraphProps {
  data: DataPoint[];
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  height?: number;
  showConfidenceInterval?: boolean;
  showGrid?: boolean;
  lang?: "en" | "mr";
  currencySymbol?: string;
  unit?: string;
}

export const SimpleGraph: React.FC<SimpleGraphProps> = ({
  data,
  color = "#1b4d18",
  gradientFrom = "#3b6934",
  gradientTo = "#3b693400",
  height = 280,
  showConfidenceInterval = true,
  showGrid = true,
  lang = "en",
  currencySymbol = "₹",
  unit = "/ Qtl",
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm font-medium">
        No graph data available
      </div>
    );
  }

  // Calculate scales
  const allPrices = data.flatMap((d) => [d.price, d.minPrice ?? d.price, d.maxPrice ?? d.price]);
  const rawMin = Math.min(...allPrices);
  const rawMax = Math.max(...allPrices);
  const padding = (rawMax - rawMin) * 0.15 || 100;
  const minVal = Math.floor((rawMin - padding) / 50) * 50;
  const maxVal = Math.ceil((rawMax + padding) / 50) * 50;

  const svgWidth = 800;
  const svgHeight = height;
  const margin = { top: 25, right: 30, bottom: 40, left: 60 };
  const graphWidth = svgWidth - margin.left - margin.right;
  const graphHeight = svgHeight - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (data.length <= 1) return margin.left + graphWidth / 2;
    return margin.left + (index / (data.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    const norm = (val - minVal) / range;
    return margin.top + (1 - norm) * graphHeight;
  };

  // Generate smooth cubic bezier SVG path
  const createSmoothPath = (points: [number, number][]) => {
    if (!points || points.length === 0) return "";
    const first = points[0];
    if (!first) return "";
    if (points.length === 1) return `M ${first[0]},${first[1]}`;

    let d = `M ${first[0]},${first[1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)] ?? first;
      const p1 = points[i] ?? first;
      const p2 = points[i + 1] ?? first;
      const p3 = points[Math.min(i + 2, points.length - 1)] ?? p2;

      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const linePoints: [number, number][] = data.map((d, i) => [getX(i), getY(d.price)]);
  const linePath = createSmoothPath(linePoints);

  const areaPath = `${linePath} L ${margin.left + graphWidth},${margin.top + graphHeight} L ${margin.left},${margin.top + graphHeight} Z`;

  // Upper & Lower Confidence Interval Band
  let ciPath = "";
  if (showConfidenceInterval && data.some((d) => d.minPrice !== undefined && d.maxPrice !== undefined)) {
    const upperPoints: [number, number][] = data.map((d, i) => [
      getX(i),
      getY(d.maxPrice ?? d.price * 1.08),
    ]);
    const lowerPoints: [number, number][] = data.map((d, i) => [
      getX(i),
      getY(d.minPrice ?? d.price * 0.92),
    ]);
    const upperPath = createSmoothPath(upperPoints);
    const lowerReversed = [...lowerPoints].reverse();
    const firstLower = lowerReversed[0];
    if (firstLower) {
      ciPath = `${upperPath} L ${firstLower[0]},${firstLower[1]} ${createSmoothPath(lowerReversed).replace(/^M\s*[\d.]+,[\d.]+/, "")} Z`;
    }
  }

  // Handle Mouse Hover / Touch
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const boundedX = Math.max(margin.left, Math.min(margin.left + graphWidth, xPos));
    const ratio = (boundedX - margin.left) / graphWidth;
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeIndex = hoverIndex !== null ? hoverIndex : data.length - 1;
  const activePoint: DataPoint = data[activeIndex] ?? data[0] ?? { date: "Today", price: 2000 };
  const activeX = getX(activeIndex);
  const activeY = getY(activePoint.price);

  // Y-axis grid step
  const gridSteps = 4;
  const yTicks = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minVal + ((maxVal - minVal) / gridSteps) * i;
    return { val: Math.round(val), y: getY(val) };
  });

  return (
    <div ref={containerRef} className="relative w-full select-none overflow-hidden group">
      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="simpleGraphAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.35} />
            <stop offset="70%" stopColor={gradientFrom} stopOpacity={0.08} />
            <stop offset="100%" stopColor={gradientTo} stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="simpleGraphCiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b6934" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3b6934" stopOpacity={0.05} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal Grid Lines */}
        {showGrid &&
          yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={tick.y}
                x2={margin.left + graphWidth}
                y2={tick.y}
                className="stroke-outline-variant/40 stroke-1"
                strokeDasharray={i === 0 ? "none" : "4 4"}
              />
              <text
                x={margin.left - 12}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-outline text-[11px] font-mono font-semibold"
              >
                {currencySymbol}
                {tick.val}
              </text>
            </g>
          ))}

        {/* X-axis Date Labels */}
        {data.map((d, i) => {
          const step = Math.ceil(data.length / 5);
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 10}
              textAnchor="middle"
              className="fill-outline text-[11px] font-bold"
            >
              {d.date}
            </text>
          );
        })}

        {/* Confidence Interval Band */}
        {showConfidenceInterval && ciPath && (
          <path d={ciPath} fill="url(#simpleGraphCiGrad)" className="animate-in fade-in duration-500" />
        )}

        {/* Area Gradient Fill */}
        <path
          d={areaPath}
          fill="url(#simpleGraphAreaGrad)"
          className="transition-all duration-300"
        />

        {/* Main Line with Glow */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="transition-all duration-300"
        />

        {/* Event Markers on Line */}
        {data.map((d, i) => {
          if (!d.event) return null;
          const cx = getX(i);
          const cy = getY(d.price);
          const isWarning = d.event.type === "warning";
          const markerColor = isWarning ? "#fe932c" : "#3b6934";

          return (
            <g key={`event-${i}`} className="cursor-pointer group/pin">
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={margin.top + graphHeight}
                stroke={markerColor}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-60"
              />
              <circle
                cx={cx}
                cy={cy}
                r="6"
                fill={markerColor}
                className="stroke-surface stroke-2 transition-transform group-hover/pin:scale-150"
              />
              <circle
                cx={cx}
                cy={cy}
                r="10"
                fill={markerColor}
                className="opacity-20 animate-ping"
              />
            </g>
          );
        })}

        {/* Hover Crosshair & Indicator Point */}
        {hoverIndex !== null && (
          <g className="transition-all duration-75">
            <line
              x1={activeX}
              y1={margin.top}
              x2={activeX}
              y2={margin.top + graphHeight}
              className="stroke-primary/70 stroke-1"
              strokeDasharray="4 3"
            />
            {/* Outer halo */}
            <circle
              cx={activeX}
              cy={activeY}
              r="9"
              fill={color}
              className="opacity-25 animate-pulse"
            />
            {/* Inner dot */}
            <circle
              cx={activeX}
              cy={activeY}
              r="5"
              fill="#ffffff"
              stroke={color}
              strokeWidth="3"
            />
          </g>
        )}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoverIndex !== null && (
        <div
          className="absolute z-20 pointer-events-none bg-inverse-surface text-inverse-on-surface p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-100 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(activeX / svgWidth) * 100}%`,
            top: `${(activeY / svgHeight) * 100 - 15}%`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 font-mono">
              {activePoint.date}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-extrabold text-inverse-primary leading-none">
              {currencySymbol}
              {activePoint.price.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] opacity-75 font-semibold">{unit}</span>
          </div>

          {activePoint.minPrice !== undefined && activePoint.maxPrice !== undefined && (
            <div className="text-[10px] opacity-75 font-medium mt-1 pt-1 border-t border-white/15 flex justify-between gap-3">
              <span>{lang === "mr" ? "किमान" : "Min"}: {currencySymbol}{activePoint.minPrice}</span>
              <span>{lang === "mr" ? "कमाल" : "Max"}: {currencySymbol}{activePoint.maxPrice}</span>
            </div>
          )}

          {activePoint.event && (
            <div className="mt-2 pt-1.5 border-t border-white/20 text-[11px]">
              <div className="font-bold text-tertiary-fixed flex items-center gap-1">
                <span>⚡</span>
                {lang === "mr" ? (activePoint.event.title_mr ?? activePoint.event.title) : activePoint.event.title}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {lang === "mr" ? (activePoint.event.description_mr ?? activePoint.event.description) : activePoint.event.description}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
