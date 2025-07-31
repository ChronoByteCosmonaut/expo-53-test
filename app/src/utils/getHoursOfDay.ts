// utils/getHoursOfDay.ts
import { setHours, setMinutes, setSeconds, format } from "date-fns";

export function getHoursOfDay(
  baseDate?: Date
): { date: Date; label: string }[] {
  const date = baseDate ?? new Date(); // fallback to now if no date passed
  const hours: { date: Date; label: string }[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = setSeconds(setMinutes(setHours(date, i), 0), 0);
    const label = format(hour, "h a"); // e.g. "1 AM"
    hours.push({ date: hour, label });
  }

  return hours;
}
