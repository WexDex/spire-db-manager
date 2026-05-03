"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SITE_LINKS: { href: string; label: string }[] = [
  { href: "/codex", label: "Codex" },
  { href: "/card-design-gallery", label: "Card design gallery" },
  { href: "/field-manager", label: "Field manager" },
  { href: "/field-runthrough", label: "Field runthrough" },
  { href: "/card-workbench", label: "Card workbench" },
  { href: "/field-icons", label: "Field icons" },
  { href: "/glyph-atlas", label: "Glyph atlas" },
];

function navItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSiteNav() {
  const pathname = usePathname() ?? "";
  const homeActive = navItemActive(pathname, "/");

  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 text-sm">
      <div className="mr-4 flex shrink-0 items-center border-r border-zinc-700/90 pr-4">
        <Link
          href="/"
          className={
            homeActive ?
              "font-semibold tracking-tight text-white"
            : "font-semibold tracking-tight text-zinc-300 transition-colors hover:text-white"
          }
        >
          Spire DB manager
        </Link>
      </div>
      <ul className="flex flex-1 flex-wrap items-center gap-1">
        {SITE_LINKS.map(({ href, label }) => {
          const active = navItemActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  active ?
                    "inline-block rounded-md bg-zinc-800 px-3 py-1.5 font-medium text-zinc-100 ring-1 ring-zinc-600/80"
                  : "inline-block rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
                }
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
