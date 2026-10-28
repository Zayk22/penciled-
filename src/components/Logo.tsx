import React from "react";

type LogoProps = {
  variant?: "full" | "mark" | "favicon";
  className?: string;
  size?: number;
};

export function Logo({ variant = "full", className = "", size = 32 }: LogoProps) {
  const isFavicon = variant === "favicon";
  const strokeWidth = isFavicon ? 3 : 2.4;

  const Mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={variant === "full" ? "text-forest" : className}
    >
      {isFavicon ? (
        <rect x="0" y="0" width="32" height="32" rx="8" fill="var(--color-forest)" />
      ) : (
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="7"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}

      {/* Three loose pencil hatch strokes: a slot being "penciled in" */}
      <g
        stroke={isFavicon ? "var(--color-paper)" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      >
        <path d="M8.5 17 L17 8.5" />
        <path d="M8.5 23.5 L23.5 8.5" />
        <path d="M15 23.5 L23.5 15" />
      </g>
    </svg>
  );

  if (variant === "mark" || variant === "favicon") {
    return Mark;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Mark}
      <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
        Penciled
      </span>
    </div>
  );
}