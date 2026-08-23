import React, { useEffect, useState } from "react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 50,
  className = "",
  animateBy = "words",
}) => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setInView(false);
    const timeout = setTimeout(() => setInView(true), 50);
    return () => clearTimeout(timeout);
  }, [text]);

  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <span className={`inline-block ${className}`}>
      {elements.map((el, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            filter: inView ? "blur(0px)" : "blur(10px)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(8px)",
            transitionDelay: `${i * delay}ms`,
          }}
        >
          {el}
          {animateBy === "words" && i < elements.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
};
