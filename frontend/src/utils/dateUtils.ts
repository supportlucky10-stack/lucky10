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

  // 1. YYYY-MM-DD or YYYY/MM/DD at start (e.g. 2026-08-25, 2026-08-25 14:01:58)
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${ymdMatch[1]}-${mm}-${dd}`;
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY at start (e.g. 25-08-2026, 25/08/2026 02:01:58 PM)
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    return `${dmyMatch[3]}-${mm}-${dd}`;
  }

  // 3. DD-MM-YY or DD/MM/YY at start (e.g. 25/08/26, 25/08/26 02:01:58 PM)
  const dmy2Match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})(?!\d)/);
  if (dmy2Match) {
    const dd = dmy2Match[1].padStart(2, '0');
    const mm = dmy2Match[2].padStart(2, '0');
    const yyyy = `20${dmy2Match[3]}`;
    return `${yyyy}-${mm}-${dd}`;
  }

  if (clean.includes(':') || clean.includes('T')) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return getLocalDateStr();
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
 * Cutoffs:
 * - 1 PM Game: OPEN until 12:58:59 PM (Cutoff at 12:59:00 PM)
 * - 3 PM Game: OPEN until 2:58:59 PM (Cutoff at 2:59:00 PM)
 * - 6 PM Game: OPEN until 5:58:59 PM (Cutoff at 5:59:00 PM)
 * - 8 PM Game: OPEN until 7:58:59 PM (Cutoff at 7:59:00 PM)
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
      return totalSeconds < 12 * 3600 + 59 * 60; // 12:59:00 (12:59 PM)
    }
    if (s.includes('3') && s.includes('PM')) {
      return totalSeconds < 15 * 3600 + 3 * 60; // 15:03:00 (3:03 PM)
    }
    if (s.includes('6') && s.includes('PM')) {
      return totalSeconds < 17 * 3600 + 59 * 60; // 17:59:00 (5:59 PM)
    }
    if (s.includes('8') && s.includes('PM')) {
      return totalSeconds < 19 * 3600 + 59 * 60; // 19:59:00 (7:59 PM)
    }
    return true;
  } catch (e) {
    return true;
  }
};

/**
 * Returns the default Game Slot for Homepage / Customer Billing based on current IST (Asia/Kolkata) time:
 * - 00:00:00 - 12:59:59 => "1 PM Game"
 * - 13:00:00 - 15:02:59 => "3 PM Game" (Until 3:03 PM)
 * - 15:03:00 - 17:59:59 => "6 PM Game"
 * - 18:00:00 - 23:59:59 => "8 PM Game"
 * At midnight (00:00:00 next day) => resets to "1 PM Game"
 */
export const getDefaultBillingSlot = (): '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game' => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes < 12 * 60 + 59) return '1 PM Game';
    if (totalMinutes < 15 * 60 + 3) return '3 PM Game';
    if (totalMinutes < 17 * 60 + 59) return '6 PM Game';
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
 * Returns the active Game Slot for the User Result page based strictly on Asia/Kolkata (IST) time:
 * - 12:00:00 AM (00:00:00) -> 2:58:59 PM (14:58:59) => "1 PM Game" (SHOW 1 PM RESULT)
 * - 2:59:00 PM (14:59:00)  -> 5:58:59 PM (17:58:59) => "3 PM Game" (SHOW 3 PM RESULT)
 * - 5:59:00 PM (17:59:00)  -> 7:58:59 PM (19:58:59) => "6 PM Game" (SHOW 6 PM RESULT)
 * - 7:59:00 PM (19:59:00)  -> 11:59:59 PM (23:59:59) => "8 PM Game" (SHOW 8 PM RESULT)
 * - 12:00:00 AM (00:00:00 next day)                  => resets to "1 PM Game" (NEW CYCLE)
 */
export const getResultPageActiveSlot = (): '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game' => {
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

    // 12:00:00 AM -> 2:58:59 PM (0 to 53,939s) => 1 PM Game
    if (totalSeconds < 14 * 3600 + 59 * 60) return '1 PM Game';
    // 2:59:00 PM -> 5:58:59 PM (53,940 to 64,739s) => 3 PM Game
    if (totalSeconds < 17 * 3600 + 59 * 60) return '3 PM Game';
    // 5:59:00 PM -> 7:58:59 PM (64,740 to 71,939s) => 6 PM Game
    if (totalSeconds < 19 * 3600 + 59 * 60) return '6 PM Game';
    // 7:59:00 PM -> 11:59:59 PM (71,940 to 86,399s) => 8 PM Game
    return '8 PM Game';
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
  return getResultPageActiveSlot();
};

/**
 * Checks if the 30-minute editing window is active for a given game slot:
 * - 1 PM Game: 1:00:00 PM (13:00) -> 1:30:00 PM (13:30)
 * - 3 PM Game: 3:00:00 PM (15:00) -> 3:30:00 PM (15:30)
 * - 6 PM Game: 6:00:00 PM (18:00) -> 6:30:00 PM (18:30)
 * - 8 PM Game: 8:00:00 PM (20:00) -> 8:30:00 PM (20:30)
 * Also if publishedAt exists on the result object, it can be edited within 30 minutes of publishedAt.
 */
export const isResultEditWindowOpen = (
  slot: '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game',
  targetDateStr: string,
  publishedAt?: string
): boolean => {
  try {
    const todayIST = getBusinessDateIST();
    if (targetDateStr !== todayIST) {
      return false; // Can only edit today's results
    }

    // Check slot-based 30-minute window in IST
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

    const slotWindows: Record<string, { startSec: number; endSec: number }> = {
      '1 PM Game': { startSec: 13 * 3600, endSec: 13 * 3600 + 30 * 60 },
      '3 PM Game': { startSec: 15 * 3600, endSec: 15 * 3600 + 30 * 60 },
      '6 PM Game': { startSec: 18 * 3600, endSec: 18 * 3600 + 30 * 60 },
      '8 PM Game': { startSec: 20 * 3600, endSec: 20 * 3600 + 30 * 60 },
    };

    const window = slotWindows[slot];
    if (window && totalSeconds >= window.startSec && totalSeconds <= window.endSec) {
      return true;
    }

    // Fallback: If publishedAt is present, allow editing within 30 minutes of publishedAt
    if (publishedAt) {
      const pubTime = new Date(publishedAt).getTime();
      const now = Date.now();
      if (!isNaN(pubTime) && now >= pubTime && now - pubTime <= 30 * 60 * 1000) {
        return true;
      }
    }

    return false;
  } catch (e) {
    return false;
  }
};

