import type { Metadata } from "next";
import { loadStsCardsFinal } from "@/lib/load-sts-cards-db";
import { FieldIconsView } from "./field-icons-view";

export const metadata: Metadata = {
  title: "Field icons",
  description:
    "EffectType → Lucide mapping editor and export (starts from bundled defaults)",
};

export default async function FieldIconsPage() {
  const { entries } = await loadStsCardsFinal();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-auto">
      <FieldIconsView entries={entries} />
    </main>
  );
}
