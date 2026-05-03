import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { FieldIconsWithStsBundle } from "@/app/components/sts-cards-db-client-routes";

export const metadata: Metadata = {
  title: "Field icons",
  description:
    "EffectType → Lucide mapping editor and export (starts from bundled defaults)",
};

export default async function FieldIconsPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-auto">
      <FieldIconsWithStsBundle serverBundleText={serverBundleText} />
    </main>
  );
}
