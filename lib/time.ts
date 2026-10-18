// Date and time helpers shared by server and client code. Times are stored as
// 24-hour "HH:MM" strings and dates as "YYYY-MM-DD", in the players' local time.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Convert 24-hour time to 12-hour format for display.
export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${pad(minutes)} ${period}`;
}

// Convert 12-hour time selections to 24-hour format for saving.
export function to24Hour(hour: string, minute: string, period: string) {
  let h = Number(hour);

  if (period === "AM" && h === 12) {
    h = 0;
  } else if (period === "PM" && h !== 12) {
    h += 12;
  }

  return `${pad(h)}:${minute}`;
}

// Split a 24-hour time into the hour, minute, and AM/PM dropdown values.
export function to12HourParts(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hour: String(hours % 12 || 12), minute: pad(minutes), period: hours >= 12 ? "PM" : "AM" };
}

export function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeString(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && toDateString(parseDate(date)) === date;
}

// Ex: "2026-10-24" -> "Saturday"
export function dayOfWeek(date: string) {
  return WEEKDAYS[parseDate(date).getDay()];
}

// Ex: "2026-10-24" -> "Sat, Oct 24, 2026"
export function formatDate(date: string) {
  return parseDate(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// The first date on or after `from` that falls on the given weekday.
export function nextDateFor(day: string, from: Date) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 7 && WEEKDAYS[date.getDay()] !== day; i++) {
    date.setDate(date.getDate() + 1);
  }
  return toDateString(date);
}

// True on or after the given date.
export function hasArrived(date: string) {
  return date <= toDateString(new Date());
}

// True once a date is clearly in the past. Allows a day of slack because the
// server's clock may be in a different timezone than the players.
export function hasPassed(date: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date < toDateString(yesterday);
}
