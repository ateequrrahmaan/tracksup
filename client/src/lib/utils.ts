import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormat(date: any, formatStr: string, fallback: string = '...') {
  if (!date) return fallback;
  try {
    let d: Date;
    if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'object' && date !== null && 'toDate' in date) {
      d = (date as any).toDate();
    } else if (typeof date === 'object' && date !== null && 'seconds' in date) {
        // Handle case where it might be a plain object from API
        d = new Date((date as any).seconds * 1000);
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch (e) {
    return fallback;
  }
}
