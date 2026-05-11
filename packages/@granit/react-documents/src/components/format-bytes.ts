/**
 * Format a byte count as a 1024-based human string (mirrors the Scriban
 * `format_bytes` filter used by the .NET back-end). Units `B`/`KB`/`MB`/
 * `GB`/`TB`/`PB`. One decimal for KB and above, integer for raw bytes.
 *
 * Negative or non-finite inputs are coerced to `0 B`.
 */
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }
  if (index === 0) {
    return `${Math.round(value).toString()} ${UNITS[index]}`;
  }
  return `${value.toFixed(1)} ${UNITS[index]}`;
}
