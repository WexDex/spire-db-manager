import type { StsCard } from "./sts-card-types";

/** Parse CSV with quoted fields, escaped `""`, and newlines inside quotes. */
function parseCsvRecords(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const c = content[i];

    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }

  row.push(field);
  const onlyEmptyAfterNewline =
    row.length === 1 && row[0] === "" && rows.length > 0;
  if (!onlyEmptyAfterNewline) {
    rows.push(row);
  }

  return rows;
}

function padSix(cols: string[]): string[] {
  const out = cols.slice();
  while (out.length < 6) out.push("");
  return out;
}

function characterFromSectionName(firstCell: string): string | null {
  const t = firstCell.trim();
  if (!/^\S.+\s+Cards$/u.test(t)) return null;
  const base = t.replace(/\s+Cards\s*$/iu, "").trim().toLowerCase();
  return base.replace(/\s+/g, "-");
}

/** Parse `Slay the Spire Reference - Cards.csv`. */
export function parseStsCardsCsv(content: string): StsCard[] {
  const raw = parseCsvRecords(content);
  if (raw.length === 0) return [];

  const cards: StsCard[] = [];
  let character = "unknown";
  let seq = 0;

  for (let ri = 0; ri < raw.length; ri++) {
    const cells = padSix(raw[ri]);

    const nameCell = cells[0].trim();
    if (!nameCell) continue;

    if (ri === 0 && nameCell.toLowerCase() === "name") {
      continue;
    }

    const sectionChar = characterFromSectionName(nameCell);
    const restBlank =
      !cells[1].trim() &&
      !cells[2].trim() &&
      !cells[3].trim() &&
      !cells[4].trim() &&
      !cells[5].trim();

    if (sectionChar && restBlank) {
      character = sectionChar;
      continue;
    }

    const type = cells[1].trim();
    const rarity = cells[2].trim();
    const cost = cells[3].trim();
    const description = cells[4] ?? "";
    const descriptionUpgraded = cells[5] ?? "";

    if (!type && !rarity) continue;

    seq += 1;
    cards.push({
      id: `${character}-${seq}`,
      name: nameCell,
      character,
      type,
      rarity,
      cost,
      description,
      descriptionUpgraded,
    });
  }

  return cards;
}
