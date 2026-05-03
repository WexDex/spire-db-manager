import type { Metadata } from "next";
import { loadStsCardsFinal } from "@/lib/load-sts-cards-db";
import { FieldRunthroughView } from "./field-runthrough-view";

export const metadata: Metadata = {
  title: "Field runthrough",
  description:
    "Review canonical STS_CARDS_DB card fields one at a time (manual pass-through)",
};

export default async function FieldRunthroughPage() {
  const { entries, galleryFieldKeys } = await loadStsCardsFinal();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <FieldRunthroughView entries={entries} galleryFieldKeys={galleryFieldKeys} />
    </main>
  );
}
