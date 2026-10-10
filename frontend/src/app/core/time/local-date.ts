/** `yyyy-MM-dd` of a date in the browser's time zone, optionally shifted by whole days. */
export function isoLocalDate(date: Date = new Date(), addDays = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
