"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string }[] = [
  { href: "/card-workbench/cards", label: "Cards" },
  { href: "/card-workbench/glyphs", label: "Glyphs" },
];

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CardWorkbenchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/98">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 sm:gap-2">
          {TABS.map(({ href, label }) => {
            const active = tabActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "inline-block rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 ring-1 ring-zinc-600/80"
                    : "inline-block rounded-md px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800/70 hover:text-zinc-300"
                }
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
