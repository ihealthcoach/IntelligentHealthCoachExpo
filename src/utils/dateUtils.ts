import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Get the user's local timezone
export function getUserTimezone(): string {
  try {
    // This gets the IANA timezone string (e.g., "America/New_York", "Europe/Copenhagen")
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC'; // Fallback to UTC
  }
}

// Convert ISO string to user's local timezone
export function toLocalTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  
  try {
    const userTimezone = getUserTimezone();
    return formatInTimeZone(
      parseISO(isoString),
      userTimezone,
      'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
    );
  } catch (error) {
    console.error('Error converting to local time:', error);
    return isoString;
  }
}

// Format date for display in user's local timezone
export function formatLocalDate(isoString: string | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
  if (!isoString) return '';
  
  try {
    const userTimezone = getUserTimezone();
    return formatInTimeZone(
      parseISO(isoString),
      userTimezone,
      formatStr
    );
  } catch (error) {
    console.error('Error formatting date in local time:', error);
    return '';
  }
}