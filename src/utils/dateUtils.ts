import { format as dateFnsFormat } from 'date-fns';

/**
 * Safely parses any date value (timestamp number in ms or s, ISO string, date string,
 * Firestore Timestamp object) into a valid JavaScript Date object in local time.
 */
export function parseTxDate(dateVal: any): Date {
  if (dateVal === null || dateVal === undefined) return new Date();

  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  }

  // Firestore Timestamp object: { seconds: number, nanoseconds: number } or with toDate()
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      try {
        const d = dateVal.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {
        // fallback
      }
    }
    if (typeof dateVal.seconds === 'number') {
      return new Date(dateVal.seconds * 1000);
    }
  }

  // Timestamp number
  if (typeof dateVal === 'number') {
    if (isNaN(dateVal)) return new Date();
    // If it's a 10-digit unix timestamp in seconds
    if (dateVal > 0 && dateVal < 10000000000) {
      return new Date(dateVal * 1000);
    }
    return new Date(dateVal);
  }

  // String
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return new Date();

    // Numeric string timestamp
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) return parseTxDate(num);
    }

    // YYYY-MM-DD (e.g. 2026-07-27) - parse using local date parameters to prevent UTC shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    // YYYY-MM-DDTHH:mm (e.g. 2026-07-27T14:30)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
      const parts = trimmed.split(/[-T:]/);
      if (parts.length >= 5) {
        return new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          Number(parts[3]),
          Number(parts[4])
        );
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

/**
 * Safe wrapper for date-fns format that never crashes on invalid date values.
 */
export function safeFormatDate(dateVal: any, formatStr: string, options?: Parameters<typeof dateFnsFormat>[2]): string {
  try {
    const d = parseTxDate(dateVal);
    return dateFnsFormat(d, formatStr, options);
  } catch (err) {
    console.error('safeFormatDate error:', err, dateVal);
    return dateFnsFormat(new Date(), formatStr, options);
  }
}
