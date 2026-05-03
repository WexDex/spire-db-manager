import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { FieldManagerWithStsBundle } from "@/app/components/sts-cards-db-client-routes";

export const metadata: Metadata = {
  title: "Field manager",
  description: "Edit structured card fields against descriptions (canonical STS_CARDS_DB)",
};

/**
 * Default bundle from [`resolveStsCardsDbPath`]; overrides via STS toolbar + localStorage.
 */
export default async function FieldManagerPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <FieldManagerWithStsBundle serverBundleText={serverBundleText} />
    </main>
  );
}
