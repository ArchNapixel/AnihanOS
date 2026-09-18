export type WeekRange = { start: string; end: string; label: string }

const formatFull = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

// Builds a YYYY-MM-DD string from a Date's local calendar fields. Using
// toISOString() here would convert through UTC and shift the date back a
// day for anyone in a positive UTC offset (e.g. UTC+8) whenever the local
// time is before the UTC offset catches up (midnight-8am for UTC+8).
function toDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Weeks run Monday–Sunday.
export function getWeekRange(dateStr: string): WeekRange {
  const date = new Date(`${dateStr}T00:00:00`)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: toDateStr(monday),
    end: toDateStr(sunday),
    label: `${formatFull(monday)} - ${formatFull(sunday)}`,
  }
}

// Every Monday–Sunday week that touches the given month at all, including
// weeks that spill into the previous/next month at either end.
export function getWeeksOverlappingMonth(year: number, monthIndex0: number): WeekRange[] {
  const firstOfMonth = new Date(year, monthIndex0, 1)
  const lastOfMonth = new Date(year, monthIndex0 + 1, 0)

  const lastWeek = getWeekRange(toDateStr(lastOfMonth))

  const weeks: WeekRange[] = []
  let cursorStr = getWeekRange(toDateStr(firstOfMonth)).start

  while (cursorStr <= lastWeek.start) {
    const week = getWeekRange(cursorStr)
    weeks.push(week)
    const next = new Date(`${week.end}T00:00:00`)
    next.setDate(next.getDate() + 1)
    cursorStr = toDateStr(next)
  }

  return weeks
}
