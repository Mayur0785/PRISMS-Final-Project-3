import React from "react";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 200,
  duration = 8,
  borderWidth = 1.5,
  colorFrom = "#3b6934",
  colorTo = "#fe932c",
  className = "",
}) => {
  return (
    <div
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--border-width": `${borderWidth}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square animate-border-beam"
        style={{
          width: "var(--size)",
          offsetPath: `rect(0 auto auto 0 round calc(var(--size) / 2))`,
          background: `linear-gradient(to left, var(--color-from), var(--color-to), transparent)`,
        }}
      />
    </div>
  );
};
