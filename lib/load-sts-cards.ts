import { readFile } from "fs/promises";
import path from "path";
import { parseStsCardsCsv } from "@/lib/parse-sts-cards-csv";
import type { StsCard } from "@/lib/sts-card-types";

const CSV_FILENAME = "Slay the Spire Reference - Cards.csv";

export async function loadStsCardsFromCsv(): Promise<StsCard[]> {
  const filePath = path.join(
    process.cwd(),
    "app",
    "data",
    CSV_FILENAME,
  );
  const text = (await readFile(filePath, "utf-8")).replace(/^\uFEFF/, "");
  return parseStsCardsCsv(text);
}
