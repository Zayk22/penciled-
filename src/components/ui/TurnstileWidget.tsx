// src/components/ui/TurnstileWidget.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
}: {
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);

  // Capture the site key once at mount. No setState in effect for this check.
  const [siteKey] = useState(() => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  // Initialize from window if script was already loaded by a previous mount.
  // The lazy initializer runs on the client only for the useState value, and
  // is serialized to the server-rendered HTML so there is no hydration mismatch.
  const [scriptLoaded, setScriptLoaded] = useState(
    () => typeof window !== "undefined" && !!window.turnstile
  );
  const [loadFailed, setLoadFailed] = useState(false);

  // Sync callbacks into refs via effect (not during render).
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onSuccess, onError, onExpire]);

  // Render the widget once the script is loaded. The callbacks read the latest
  // prop via the refs above, so the effect only depends on scriptLoaded + siteKey.
  useEffect(() => {
    if (
      !scriptLoaded ||
      renderedRef.current ||
      !containerRef.current ||
      !window.turnstile ||
      !siteKey
    ) {
      return;
    }

    renderedRef.current = true;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (t) => onSuccessRef.current(t),
      "expired-callback": () => onExpireRef.current(),
      "error-callback": () => onErrorRef.current(),
    });
  }, [scriptLoaded, siteKey]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      renderedRef.current = false;
    };
  }, []);

  const scriptError = !siteKey || loadFailed;

  if (scriptError) {
    return (
      <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">
        Could not load the verification widget. Check your connection and refresh the page.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setLoadFailed(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}