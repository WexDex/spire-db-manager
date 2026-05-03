"use client";

import { StsCardsDbManagedLayout } from "@/app/components/sts-cards-db-managed-layout";
import { CodexView } from "@/app/codex/codex-view";
import { FieldManagerView } from "@/app/field-manager/field-manager-view";
import { FieldRunthroughView } from "@/app/field-runthrough/field-runthrough-view";
import { FieldIconsView } from "@/app/field-icons/field-icons-view";
import { CardWorkbenchCardsView } from "@/app/card-workbench/cards/card-workbench-cards-view";

/** Shared top offset under site header — keeps bundle controls visible while scrolling. */
const STS_TOOLBAR_STICKY =
  "sticky top-0 z-20 shrink-0 border-zinc-800/90 shadow-sm shadow-black/20";

type Props = { serverBundleText: string };

export function CodexWithStsBundle({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName={STS_TOOLBAR_STICKY}
    >
      {(bundle) => <CodexView entries={bundle.entries} />}
    </StsCardsDbManagedLayout>
  );
}

export function FieldManagerWithStsBundle({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName={STS_TOOLBAR_STICKY}
    >
      {(bundle) => (
        <FieldManagerView
          entries={bundle.entries}
          galleryFieldKeys={bundle.galleryFieldKeys}
        />
      )}
    </StsCardsDbManagedLayout>
  );
}

export function FieldRunthroughWithStsBundle({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName={STS_TOOLBAR_STICKY}
    >
      {(bundle) => (
        <FieldRunthroughView
          entries={bundle.entries}
          galleryFieldKeys={bundle.galleryFieldKeys}
        />
      )}
    </StsCardsDbManagedLayout>
  );
}

export function FieldIconsWithStsBundle({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName={STS_TOOLBAR_STICKY}
    >
      {(bundle) => <FieldIconsView entries={bundle.entries} />}
    </StsCardsDbManagedLayout>
  );
}

export function CardWorkbenchCardsWithStsBundle({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName={STS_TOOLBAR_STICKY}
    >
      {(bundle) => (
        <CardWorkbenchCardsView
          entries={bundle.entries}
          galleryFieldKeys={bundle.galleryFieldKeys}
        />
      )}
    </StsCardsDbManagedLayout>
  );
}
