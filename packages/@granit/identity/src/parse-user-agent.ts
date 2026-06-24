import type { DeviceKind, UserDeviceResponse } from './types/index';

/** The device-shaped subset {@link composeDeviceLabel} consumes. */
export type ParsedUserAgent = Pick<UserDeviceResponse, 'kind' | 'operatingSystem' | 'browser'>;

/** Operating systems we treat as handheld for icon selection. */
const MOBILE_OPERATING_SYSTEMS: ReadonlySet<string> = new Set(['iOS', 'Android']);

/**
 * Browser families matched against the User-Agent, in priority order. Order
 * matters: Edge and Opera masquerade as Chrome, and Chrome masquerades as
 * Safari, so the more specific tokens must win first.
 */
const BROWSERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
  [/\b(?:OPR|Opera)\//, 'Opera'],
  [/\bSamsungBrowser\//, 'Samsung Internet'],
  [/\b(?:Chrome|CriOS|Chromium)\//, 'Chrome'],
  [/\b(?:Firefox|FxiOS)\//, 'Firefox'],
  [/\bVersion\/[\d.]+ Mobile.*Safari\/|\bSafari\//, 'Safari'],
];

/**
 * Device kinds inferable from a User-Agent, in priority order. Most browser
 * agents fall through to `Browser`; only TVs and wearables expose reliable
 * tokens, so we surface those for a more accurate per-session icon.
 */
const KINDS: ReadonlyArray<readonly [RegExp, DeviceKind]> = [
  [/\b(?:SmartTV|SMART-TV|AppleTV|GoogleTV|CrKey|HbbTV|BRAVIA|Web0S)\b/i, 'Tv'],
  [/\bWatch\b/, 'Wearable'],
];

/** Operating-system families matched against the User-Agent, in priority order. */
const OPERATING_SYSTEMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Windows NT/, 'Windows'],
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\b(?:Macintosh|Mac OS X)\b/, 'macOS'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bLinux\b/, 'Linux'],
];

function matchFirst<T extends string>(
  ua: string,
  table: ReadonlyArray<readonly [RegExp, T]>
): T | null {
  for (const [pattern, label] of table) {
    if (pattern.test(ua)) return label;
  }
  return null;
}

/**
 * Best-effort parse of a raw `User-Agent` string into the device shape
 * {@link composeDeviceLabel} renders — so a session's free-text agent reads as
 * "Chrome on Windows" instead of the full `Mozilla/5.0 …` blob.
 *
 * Returns `null` when the string is empty or yields neither a browser nor an OS;
 * callers fall back to their localized "unknown device" label. The raw string
 * stays the source of truth (keep it as a tooltip) — this is presentation only.
 */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent | null {
  if (!userAgent) return null;
  const browser = matchFirst(userAgent, BROWSERS);
  const operatingSystem = matchFirst(userAgent, OPERATING_SYSTEMS);
  const kind: DeviceKind = matchFirst(userAgent, KINDS) ?? 'Browser';
  if (kind === 'Browser' && !browser && !operatingSystem) return null;
  return { kind, operatingSystem, browser };
}

/** Whether a parsed agent should render with the handheld (phone) icon. */
export function isHandheldUserAgent(parsed: ParsedUserAgent | null): boolean {
  return parsed?.operatingSystem != null && MOBILE_OPERATING_SYSTEMS.has(parsed.operatingSystem);
}
