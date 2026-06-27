export type IcalEvent = {
  summary: string;
  location: string;
  start: Date;
  end: Date | null;
};

function unfoldIcal(text: string): string {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function extractField(block: string, name: string): string {
  const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim() ?? "";
}

function parseIcalDate(raw: string): Date {
  const value = raw.trim();
  if (/^\d{8}T\d{6}Z$/i.test(value)) {
    const y = value.slice(0, 4);
    const mo = value.slice(4, 6);
    const d = value.slice(6, 8);
    const h = value.slice(9, 11);
    const mi = value.slice(11, 13);
    const s = value.slice(13, 15);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  }
  if (/^\d{8}T\d{6}$/i.test(value)) {
    const y = value.slice(0, 4);
    const mo = value.slice(4, 6);
    const d = value.slice(6, 8);
    const h = value.slice(9, 11);
    const mi = value.slice(11, 13);
    const s = value.slice(13, 15);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  }
  if (/^\d{8}$/i.test(value)) {
    const y = value.slice(0, 4);
    const mo = value.slice(4, 6);
    const d = value.slice(6, 8);
    return new Date(`${y}-${mo}-${d}T00:00:00`);
  }
  return new Date(value);
}

export function parseIcalEvents(ical: string): IcalEvent[] {
  const flat = unfoldIcal(ical);
  const chunks = flat.split("BEGIN:VEVENT").slice(1);
  const events: IcalEvent[] = [];

  for (const chunk of chunks) {
    const block = chunk.split("END:VEVENT")[0] ?? chunk;
    const startRaw = extractField(block, "DTSTART");
    if (!startRaw) continue;
    const endRaw = extractField(block, "DTEND");
    events.push({
      summary: extractField(block, "SUMMARY"),
      location: extractField(block, "LOCATION"),
      start: parseIcalDate(startRaw),
      end: endRaw ? parseIcalDate(endRaw) : null,
    });
  }

  return events;
}
