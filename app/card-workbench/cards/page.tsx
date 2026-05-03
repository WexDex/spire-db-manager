import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { CardWorkbenchCardsWithStsBundle } from "@/app/components/sts-cards-db-client-routes";

export const metadata: Metadata = {
  title: "Cards · Card workbench",
  description:
    "Fast STS card correction: collapse chrome, browse cards, edit fields and full JSON (syncs with Field Manager storage)",
};

export default async function CardWorkbenchCardsPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <CardWorkbenchCardsWithStsBundle serverBundleText={serverBundleText} />
    </main>
  );
}
