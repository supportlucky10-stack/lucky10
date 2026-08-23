/**
 * Returns a date string in YYYY-MM-DD format using the local timezone.
 * Avoids UTC offset shifts caused by toISOString().
 */
export const getLocalDateStr = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats YYYY-MM-DD to DD-MM-YYYY for UI display.
 */
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

/**
 * Extracts a normalized YYYY-MM-DD date string from various raw date/timestamp formats
 * (e.g. "2026-08-19 14:05:32", "2026-08-19T14:05:32", "19-08-2026 14:05:32", "19/08/2026").
 */
export const extractDateStr = (raw?: string): string => {
  if (!raw) return getLocalDateStr();
  let clean = raw.trim();
  if (clean.includes(':') || clean.includes('T')) {
    if (!clean.endsWith('Z') && !clean.includes('+') && !clean.match(/[+-]\d{2}:\d{2}$/)) {
      clean = clean.replace(' ', 'T') + 'Z';
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Match YYYY-MM-DD or YYYY/MM/DD at start
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }
  // Match DD-MM-YYYY or DD/MM/YYYY at start
  const dmyMatch = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  return clean.split('T')[0].split(' ')[0] || getLocalDateStr();
};

/**
 * Returns current business date in YYYY-MM-DD in Asia/Kolkata (IST).
 */
export const getBusinessDateIST = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return getLocalDateStr();
  }
};

/**
 * Checks if billing for a game slot is OPEN in Asia/Kolkata (IST).
 * Cutoffs: 1 PM at 13:00, 3 PM at 15:00, 6 PM at 18:00, 8 PM at 20:00.
 */
export const isGameSlotOpen = (slotName: string): boolean => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);
    const totalSeconds = hour * 3600 + minute * 60 + second;

    const s = (slotName || '').toUpperCase();
    if (s.includes('1') && s.includes('PM')) {
      return totalSeconds < 13 * 3600;
    }
    if (s.includes('3') && s.includes('PM')) {
      return totalSeconds < 15 * 3600;
    }
    if (s.includes('6') && s.includes('PM')) {
      return totalSeconds < 18 * 3600;
    }
    if (s.includes('8') && s.includes('PM')) {
      return totalSeconds < 20 * 3600;
    }
    return true;
  } catch (e) {
    return true;
  }
};

/**
 * Returns the default Game Slot for Homepage / Customer Billing based on current IST (Asia/Kolkata) time:
 * - 00:00:00 - 12:59:59 => "1 PM Game"
 * - 13:00:00 - 14:59:59 => "3 PM Game"
 * - 15:00:00 - 17:59:59 => "6 PM Game"
 * - 18:00:00 - 23:59:59 => "8 PM Game"
 * At midnight (00:00:00 next day) => resets to "1 PM Game"
 */
export const getDefaultBillingSlot = (): '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game' => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour < 13) return '1 PM Game';
    if (hour < 15) return '3 PM Game';
    if (hour < 18) return '6 PM Game';
    return '8 PM Game';
  } catch (e) {
    return '1 PM Game';
  }
};

/**
 * Returns the default Game Slot for Admin publishing based on current IST time.
 */
export const getDefaultPublishSlot = (): '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game' => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour >= 20) return '8 PM Game';
    if (hour >= 18) return '6 PM Game';
    if (hour >= 15) return '3 PM Game';
    return '1 PM Game';
  } catch (e) {
    return '1 PM Game';
  }
};

/**
 * Determines the authoritative default Game Slot to display on the Customer Result page:
 * 1. Checks today's published results in reverse chronological order (8 PM, 6 PM, 3 PM, 1 PM).
 * 2. If one or more results have been published for today, returns the latest published slot.
 * 3. If no result is published yet today, falls back to the current active cycle slot via getDefaultBillingSlot().
 */
export const getLatestPublishedOrCycleSlot = (
  todayDateStr: string,
  getResultForSlotAndDate: (slot: '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game', dateStr: string) => { prize1?: string }
): '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game' => {
  const reverseSlots: ('1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game')[] = [
    '8 PM Game',
    '6 PM Game',
    '3 PM Game',
    '1 PM Game',
  ];
  for (const slot of reverseSlots) {
    const res = getResultForSlotAndDate(slot, todayDateStr);
    if (res && res.prize1 && res.prize1.trim().length > 0) {
      return slot;
    }
  }
  return getDefaultBillingSlot();
};
