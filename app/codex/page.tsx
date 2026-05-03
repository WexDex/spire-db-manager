import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { CodexWithStsBundle } from "@/app/components/sts-cards-db-client-routes";

export const metadata: Metadata = {
  title: "Spire codex",
  description: "Browse and filter Slay the Spire card data",
};

export default async function CodexPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <CodexWithStsBundle serverBundleText={serverBundleText} />
    </main>
  );
}
