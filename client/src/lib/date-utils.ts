import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  } catch (e) {
    return timeString;
  }
}

export function getCalendarDays(date: Date) {
  const firstDay = startOfMonth(date);
  const lastDay = endOfMonth(date);
  
  return eachDayOfInterval({ start: firstDay, end: lastDay }).map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, new Date()),
    formattedDate: formatDate(day)
  }));
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}
