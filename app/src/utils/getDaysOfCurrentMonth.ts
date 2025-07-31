// utils/getDaysOfCurrentMonth.ts

import { startOfMonth, endOfMonth, addDays, format, isAfter } from "date-fns";

export function getDaysOfCurrentMonth(): {
  date: Date;
  formatted: string;
  dayOfWeek: string;
}[] {
  const start = startOfMonth(new Date());
  const end = endOfMonth(start);

  const days = [];

  for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
    days.push({
      date: d,
      formatted: format(d, "dd"),
      dayOfWeek: format(d, "EEE"), // e.g. "Mon", "Tue"
    });
  }

  return days;
}
