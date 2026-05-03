"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CircleHelp,
  FolderOpen,
  Download,
  RotateCcw,
} from "lucide-react";
import type { StsFinalLoadResult } from "@/lib/sts-cards-db-parse-document";
import { parseStsCardsDocument } from "@/lib/sts-cards-db-parse-document";
import { STS_CARDS_DB_FILENAME } from "@/lib/sts-cards-db-bundle-constants";
import {
  STS_CARDS_DB_LOCAL_STORAGE_KEY,
  clearStoredStsCardsDbText,
  loadStoredStsCardsDbText,
  saveStoredStsCardsDbText,
} from "@/lib/sts-cards-db-local-session";

const LAST_SESSION_TOOLTIP =
  "This app remembers the last STS_CARDS_DB.json you loaded in this browser " +
  "(via localStorage on this origin). Returning here uses that saved copy instead of " +
  "the project default file until you reset to default or pick a new file.";

type StsCardsDbBundleContextValue = {
  /** Pretty-printed JSON matching in-memory bundle (export / localStorage). */
  bundleText: string;
  bundleData: StsFinalLoadResult;
  hydrated: boolean;
  lastSessionApplied: boolean;
  /** Load succeeded but writing to localStorage failed (quota / private mode). */
  sessionSaveFailed: boolean;
  applyRawBundleText: (text: string) => void;
  importBundleFromFile: (file: File) => Promise<{ ok: true } | { ok: false; message: string }>;
  resetToServerDefaultBundle: () => void;
  exportCurrentBundleAsFile: () => void;
};

const StsCardsDbBundleContext = createContext<StsCardsDbBundleContextValue | null>(
  null,
);

export function useStsCardsDbBundle(): StsCardsDbBundleContextValue {
  const ctx = useContext(StsCardsDbBundleContext);
  if (!ctx) {
    throw new Error("useStsCardsDbBundle must be used within StsCardsDbBundleProvider");
  }
  return ctx;
}

type ProviderProps = {
  serverBundleText: string;
  children: React.ReactNode;
};

export function StsCardsDbBundleProvider({
  serverBundleText,
  children,
}: ProviderProps) {
  const bundleTextParser = useCallback((text: string) => {
    const trimmed = text.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(trimmed) as unknown;
    const bundleData = parseStsCardsDocument(parsed);
    const normalized = `${JSON.stringify(parsed, null, 2)}\n`;
    return { bundleText: normalized, bundleData };
  }, []);

  const [bundleText, setBundleText] = useState(
    () => bundleTextParser(serverBundleText).bundleText,
  );
  const [bundleData, setBundleData] = useState<StsFinalLoadResult>(
    () => bundleTextParser(serverBundleText).bundleData,
  );

  const [hydrated, setHydrated] = useState(false);
  const [lastSessionApplied, setLastSessionApplied] = useState(false);
  const [sessionSaveFailed, setSessionSaveFailed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = loadStoredStsCardsDbText();
      if (stored) {
        try {
          const trimmed = stored.replace(/^\uFEFF/, "");
          JSON.parse(trimmed);
          const { bundleText: nextText, bundleData: nextData } =
            bundleTextParser(stored);
          setBundleText(nextText);
          setBundleData(nextData);
          setLastSessionApplied(true);
          setSessionSaveFailed(false);
        } catch {
          /* ignore corrupt session */
        }
      }
      setHydrated(true);
    });
  }, [bundleTextParser]);

  const applyRawBundleText = useCallback(
    (raw: string) => {
      const { bundleText: nextText, bundleData: nextData } =
        bundleTextParser(raw);
      setBundleText(nextText);
      setBundleData(nextData);
      try {
        saveStoredStsCardsDbText(nextText);
      } catch {
        setLastSessionApplied(false);
        setSessionSaveFailed(true);
        return;
      }
      setLastSessionApplied(true);
      setSessionSaveFailed(false);
    },
    [bundleTextParser],
  );

  const importBundleFromFile = useCallback(
    async (
      file: File,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        const raw = await file.text();
        try {
          applyRawBundleText(raw);
          return { ok: true };
        } catch (e) {
          const msg =
            e instanceof Error ?
              e.message
            : "Could not interpret this bundle.";
          return { ok: false, message: msg };
        }
      } catch {
        const msg = "Could not read the file.";
        return { ok: false, message: msg };
      }
    },
    [applyRawBundleText],
  );

  const resetToServerDefaultBundle = useCallback(() => {
    clearStoredStsCardsDbText();
    try {
      const { bundleText: nextText, bundleData: nextData } =
        bundleTextParser(serverBundleText);
      setBundleText(nextText);
      setBundleData(nextData);
      setLastSessionApplied(false);
      setSessionSaveFailed(false);
    } catch {
      /* keep prior bundle if default parse fails */
    }
  }, [bundleTextParser, serverBundleText]);

  const exportCurrentBundleAsFile = useCallback(() => {
    const blob = new Blob([bundleText], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = STS_CARDS_DB_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }, [bundleText]);

  const value = useMemo(
    (): StsCardsDbBundleContextValue => ({
      bundleText,
      bundleData,
      hydrated,
      lastSessionApplied,
      sessionSaveFailed,
      applyRawBundleText,
      importBundleFromFile,
      resetToServerDefaultBundle,
      exportCurrentBundleAsFile,
    }),
    [
      applyRawBundleText,
      bundleData,
      bundleText,
      exportCurrentBundleAsFile,
      hydrated,
      importBundleFromFile,
      lastSessionApplied,
      resetToServerDefaultBundle,
      sessionSaveFailed,
    ],
  );

  return (
    <StsCardsDbBundleContext.Provider value={value}>
      {children}
      {hydrated ? null : (
        <span className="sr-only" aria-live="polite">
          Applying saved STS bundle preference…
        </span>
      )}
    </StsCardsDbBundleContext.Provider>
  );
}

type ToolbarProps = {
  className?: string;
};

/**
 * STS_CARDS_DB load / reset / export; shows source hint via help tooltip.
 */
export function StsCardsDbToolbar({ className }: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    bundleData,
    lastSessionApplied,
    sessionSaveFailed,
    importBundleFromFile,
    resetToServerDefaultBundle,
    exportCurrentBundleAsFile,
  } = useStsCardsDbBundle();

  const [localErr, setLocalErr] = useState<string | null>(null);

  return (
    <div
      className={`flex flex-col gap-2 border-b border-zinc-800/90 bg-zinc-950/80 px-4 py-2.5 ${
        className ?? ""
      }`}
      role="region"
      aria-label="STS_CARDS_DB.json bundle controls"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 gap-y-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {STS_CARDS_DB_FILENAME.replace(".json", "")}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            sessionSaveFailed ?
              "bg-amber-950/50 text-amber-200/95 ring-1 ring-amber-800/55"
            : lastSessionApplied ?
              "bg-teal-950/60 text-teal-300/95 ring-1 ring-teal-800/55"
            : "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800"
          }`}
          title={
            sessionSaveFailed ?
              "Bundle is in memory only — localStorage save failed (often quota or privacy mode)."
            : lastSessionApplied ?
              "Using the JSON last saved for this browser (localStorage), replacing the built-in default."
            : "Using the project default bundle from disk (SSR snapshot)."
          }
        >
          {sessionSaveFailed ?
            "In memory"
          : lastSessionApplied ?
            "Saved session"
          : "App default"}
        </span>
        <span className="text-[11px] text-zinc-500">
          · {bundleData.entries.length} cards
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            setLocalErr(null);
            if (!f) return;
            void importBundleFromFile(f).then((res) => {
              if (!res.ok) setLocalErr(res.message);
            });
          }}
        />
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/85 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-800"
            onClick={() => inputRef.current?.click()}
          >
            <FolderOpen className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Load JSON…
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/85 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-800"
            onClick={() => exportCurrentBundleAsFile()}
          >
            <Download className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/85 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
            title="Discard the saved browser copy and reload data from the app’s default STS_CARDS_DB path."
            onClick={() => {
              setLocalErr(null);
              resetToServerDefaultBundle();
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 opacity-70" aria-hidden />
            Reset to default
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
            title={LAST_SESSION_TOOLTIP}
            aria-label={`About restoring the last STS bundle (${LAST_SESSION_TOOLTIP})`}
          >
            <CircleHelp className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-snug text-zinc-600">
        <span title={LAST_SESSION_TOOLTIP} className="cursor-help border-b border-dotted border-zinc-600">
          Last session
        </span>
        : On open, the app restores the last successfully loaded JSON from this browser
        (localStorage key{" "}
        <code className="rounded bg-zinc-900 px-1 font-mono text-zinc-500">
          {STS_CARDS_DB_LOCAL_STORAGE_KEY}
        </code>
        ) when present.&nbsp;
        Export downloads the bundle currently in memory (independent copy per toolbar).
      </p>
      {sessionSaveFailed ? (
        <p className="text-[11px] text-amber-200/95">
          This bundle is loaded in memory but was not saved for the next visit (browser
          storage failed). Use Export or free space, then Load again if you want it
          persisted.
        </p>
      ) : null}
      {localErr ? (
        <p className="text-[11px] text-rose-300/95">{localErr}</p>
      ) : null}
    </div>
  );
}
