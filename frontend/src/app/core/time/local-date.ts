/** `yyyy-MM-dd` of a date in the browser's time zone, optionally shifted by whole days. */
export function isoLocalDate(date: Date = new Date(), addDays = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `yyyy-MM-ddTHH:mm` (value of an `<input type="datetime-local">`) for a date in the browser's time zone. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses a `datetime-local` value (browser time zone) into an ISO instant (UTC), or null if empty/invalid. */
export function dateTimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
