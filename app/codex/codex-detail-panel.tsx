"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CodexCard } from "@/lib/codex-card-types";
import { groupCardKeys } from "@/lib/sts-card-sections";

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) {
    return <span className="text-zinc-500 italic">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-amber-300/90">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="tabular-nums text-sky-300/90">{value}</span>;
  }
  if (typeof value === "string") {
    const isLong = value.length > 120 || value.includes("\n");
    if (isLong) {
      return (
        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-700/80 bg-zinc-950/80 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300">
          {value}
        </pre>
      );
    }
    return <span className="break-words text-zinc-200">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-zinc-500">[]</span>;
    }
    const primitive =
      value.every((v) => v === null || ["string", "number", "boolean"].includes(typeof v));
    if (primitive) {
      return (
        <span className="text-zinc-300">
          [{value.map((v) => String(v)).join(", ")}]
        </span>
      );
    }
    return (
      <ul
        className={`mt-1 space-y-2 border-l-2 border-zinc-700/80 pl-3 ${depth > 2 ? "" : ""}`}
      >
        {value.map((item, i) => (
          <li key={i} className="text-sm">
            <JsonValue value={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o);
    if (keys.length === 0) {
      return <span className="text-zinc-500">{"{}"}</span>;
    }
    return (
      <dl className="mt-1 space-y-1.5 border-l-2 border-zinc-700/60 pl-3 font-mono text-xs">
        {keys.map((k) => (
          <div key={k}>
            <dt className="inline text-zinc-500">{k}</dt>
            <dd className="mt-0.5 block text-zinc-200">
              <JsonValue value={o[k]} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="text-zinc-500">—</span>;
}

type Props = {
  card: CodexCard | null;
  onClose: () => void;
};

export function CodexDetailPanel({ card, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [card, onClose]);

  if (!mounted || !card) {
    return null;
  }

  const data: Record<string, unknown> = {
    ...card.raw,
    name: card.name,
    id: card.id,
  };
  const sections = groupCardKeys(data);

  const node = (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="codex-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Close details"
        onClick={onClose}
      />
      <div className="relative flex max-h-full w-full max-w-2xl flex-col border-zinc-700 bg-zinc-900 shadow-2xl sm:max-h-[90vh] sm:rounded-xl sm:border">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="codex-detail-title"
              className="truncate text-lg font-semibold text-zinc-100"
            >
              {card.name}
            </h2>
            <p className="truncate font-mono text-xs text-zinc-500">{card.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-8">
            {sections.map(({ title, entries }) => (
              <section key={title} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {title}
                </h3>
                <dl className="space-y-3">
                  {entries.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5"
                    >
                      <dt className="font-mono text-[11px] font-medium text-sky-400/90">
                        {key}
                      </dt>
                      <dd className="mt-1.5 text-sm">
                        <JsonValue value={value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
