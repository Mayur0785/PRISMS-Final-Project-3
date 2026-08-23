import React, { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.2,
  className = "",
  prefix = "",
  suffix = "",
  decimals = 0,
}) => {
  const [current, setCurrent] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = from;
    const endVal = to;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (endVal - startVal) * easeOut;

      setCurrent(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [to, from, duration]);

  const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString("en-IN");

  return (
    <span className={`inline-block tabular-nums transition-all ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
