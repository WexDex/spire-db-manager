"use client";

import type { StsFinalLoadResult } from "@/lib/sts-cards-db-parse-document";
import {
  StsCardsDbBundleProvider,
  StsCardsDbToolbar,
  useStsCardsDbBundle,
} from "./sts-cards-db-bundle-provider";

export function StsCardsDbManagedLayout({
  serverBundleText,
  toolbarClassName,
  children,
}: {
  serverBundleText: string;
  toolbarClassName?: string;
  children: (bundle: StsFinalLoadResult) => React.ReactNode;
}) {
  return (
    <StsCardsDbBundleProvider serverBundleText={serverBundleText}>
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
        <StsCardsDbToolbar className={toolbarClassName ?? "shrink-0"} />
        <StsManagedInner>{children}</StsManagedInner>
      </div>
    </StsCardsDbBundleProvider>
  );
}

function StsManagedInner({
  children,
}: {
  children: (bundle: StsFinalLoadResult) => React.ReactNode;
}) {
  const { bundleData } = useStsCardsDbBundle();
  return (
    <div className="min-h-0 min-w-0 flex-1">{children(bundleData)}</div>
  );
}
