"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/availability", label: "Availability" },
  { href: "/dashboard/event-types", label: "Event types" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface h-[100dvh] sticky top-0">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard">
            <Logo variant="full" size={24} />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-md text-sm transition-colors ${
                isActive(link.href)
                  ? "bg-forest/10 text-forest font-semibold"
                  : "text-muted font-medium hover:bg-border/30 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-xs transition-colors ${
                isActive(link.href) ? "text-forest font-semibold" : "text-muted font-medium hover:text-ink"
              }`}
            >
              {isActive(link.href) && (
                <span className="absolute top-0 w-8 h-[2px] bg-forest rounded-b-full" />
              )}
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}