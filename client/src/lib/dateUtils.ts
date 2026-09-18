// Builds a YYYY-MM-DD string from a Date's local calendar fields. Using
// toISOString() instead would convert through UTC and shift the date back a
// day for anyone in a positive UTC offset (e.g. UTC+8, the Philippines)
// whenever local time is before the UTC offset catches up (midnight-8am for
// UTC+8).
export function toDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toDateStr(new Date())
}

// Formats a date string (or null) for display, e.g. "Sep 18, 2026".
export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
