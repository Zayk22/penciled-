import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        // min-h-[44px] for mobile touch, text-base (16px) prevents iOS zoom
        className={`flex min-h-[44px] w-full rounded-md border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-error focus-visible:ring-error" : "border-border focus-visible:border-forest"
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
}