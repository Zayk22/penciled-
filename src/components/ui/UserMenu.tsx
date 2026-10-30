"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { IconCheck } from "@/components/icons";

export function UserMenu({ username }: { username: string }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : username.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-forest text-paper font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors hover:bg-[#164632]"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-surface shadow-sm py-1 z-50">
          <Link
            href={`/${username}`}
            target="_blank"
            className="block px-4 py-2 text-sm text-ink hover:bg-border/30"
            onClick={() => setIsOpen(false)}
          >
            Public profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2 text-sm text-ink hover:bg-border/30"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <div className="h-px bg-border my-1"></div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-border/30"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md border border-border-strong text-sm font-medium hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
    >
      {copied ? (
        <>
          <IconCheck width={16} height={16} className="mr-2 text-forest" />
          Copied
        </>
      ) : (
        "Copy link"
      )}
    </button>
  );
}