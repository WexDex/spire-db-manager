import type { Metadata } from "next";
import { loadStsCardsFromDb } from "@/lib/load-sts-cards-db";
import { CodexView } from "./codex-view";

export const metadata: Metadata = {
  title: "Spire codex",
  description: "Browse and filter Slay the Spire card data",
};

export default async function CodexPage() {
  const entries = await loadStsCardsFromDb();
  return <CodexView entries={entries} />;
}
