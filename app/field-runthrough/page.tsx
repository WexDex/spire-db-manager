import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { FieldRunthroughWithStsBundle } from "@/app/components/sts-cards-db-client-routes";

export const metadata: Metadata = {
  title: "Field runthrough",
  description:
    "Review canonical STS_CARDS_DB card fields one at a time (manual pass-through)",
};

export default async function FieldRunthroughPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <FieldRunthroughWithStsBundle serverBundleText={serverBundleText} />
    </main>
  );
}
