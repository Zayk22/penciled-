import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Fix #6: min-h-[44px] confirmed
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper min-h-[44px]";
  
  // Fix #1: Only 'disabled' triggers opacity fade. 'loading' uses pointer-events to block clicks.
  const variants = {
    primary: "bg-forest text-paper hover:bg-[#164632] px-6 disabled:opacity-50",
    secondary: "bg-transparent border border-border-strong text-ink hover:bg-surface px-6 disabled:opacity-50", // Fix #9
    ghost: "bg-transparent text-ink hover:bg-border/50 px-4 disabled:opacity-50",
  };

  const stateStyles = loading ? "pointer-events-none" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${stateStyles} ${className}`}
      disabled={disabled} // Do not disable for loading, just block pointers
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}