const FORMULA_PREFIX = /^[=+\-@]/;

export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  let cell = value == null ? "" : String(value);
  if (FORMULA_PREFIX.test(cell)) {
    cell = `'${cell}`;
  }
  return `"${cell.replace(/"/g, '""')}"`;
}

export function toCsvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map(sanitizeCsvCell).join(",");
}

export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const lines = [toCsvRow(headers), ...rows.map((row) => toCsvRow(row))];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      current.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      current.push(field);
      if (current.some((item) => item.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
      field = "";
      continue;
    }
    field += char;
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((item) => item.trim().length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

export function csvHeaderMap(headerRow: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    const key = cell.trim();
    if (key) {
      map.set(key, index);
    }
  });
  return map;
}
