// utils/date.ts

/**
 * Format a date string (ISO or Date) to DD/MM/YY
 * Example: '2025-11-03' -> '03/11/25'
 */
export function formatDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Convert a date string from DD/MM/YY (or DD/MM/YYYY) back to ISO (YYYY-MM-DD)
 * for storage or server actions.
 */
export function toISODate(value?: string | null): string | null {
  if (!value) return null;
  // Accept DD/MM/YY or DD/MM/YYYY
  const parts = value.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length < 3) return null;

  let [d, m, y] = parts;
  if (y.length === 2) y = '20' + y;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return iso;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
