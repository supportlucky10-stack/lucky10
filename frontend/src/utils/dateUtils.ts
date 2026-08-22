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
