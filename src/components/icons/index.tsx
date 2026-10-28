import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4, // Matches the logo weight
  strokeLinecap: "round", // Matches the logo caps
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 12l6 6L20 6" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}