// Browsers never expose the real machine hostname (sandboxed for privacy), and
// WebAuthn returns no device identity either. The best we can do is derive a
// human-friendly "{browser} – {os}" label so the user recognises this passkey
// later. Prefer low-entropy User-Agent Client Hints (Chromium) — no async, no
// permission prompt — and fall back to userAgent parsing (Safari/Firefox).
// The value is only a suggestion: the user edits it freely before saving.

interface UADataBrand {
  readonly brand: string;
  readonly version: string;
}

interface NavigatorUAData {
  readonly brands?: readonly UADataBrand[];
  readonly platform?: string;
}

// GREASE brands ("Not.A/Brand", "Not)A;Brand", …) and the generic "Chromium"
// engine name are noise — we want the user-facing browser.
const IGNORED_BRAND = /not.?a.?brand|chromium/i;

const BRAND_ALIASES: Readonly<Record<string, string>> = {
  'Google Chrome': 'Chrome',
  'Microsoft Edge': 'Edge',
};

function getUAData(): NavigatorUAData | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
}

function browserFromBrands(brands: readonly UADataBrand[]): string | undefined {
  const named = brands.find((b) => !IGNORED_BRAND.test(b.brand));
  if (named) return BRAND_ALIASES[named.brand] ?? named.brand;
  return brands.length > 0 ? 'Chromium' : undefined;
}

function browserFromUA(ua: string): string | undefined {
  if (/edg(a|ios)?\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/firefox\/|fxios\//i.test(ua)) return 'Firefox';
  if (/chrome\/|crios\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua)) return 'Safari';
  return undefined;
}

function osFromUA(ua: string): string | undefined {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/iphone|ipod/i.test(ua)) return 'iOS';
  if (/ipad/i.test(ua)) return 'iPadOS';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/android/i.test(ua)) return 'Android';
  if (/linux/i.test(ua)) return 'Linux';
  return undefined;
}

/**
 * Best-effort default label for a new passkey, e.g. `"Chrome – Windows"`.
 * Returns an empty string when nothing can be detected (SSR, locked-down UA).
 */
export function getDefaultPasskeyName(): string {
  const uaData = getUAData();
  let browser = uaData?.brands?.length ? browserFromBrands(uaData.brands) : undefined;
  let os = uaData?.platform || undefined;

  if ((!browser || !os) && typeof navigator !== 'undefined') {
    const { userAgent } = navigator;
    browser ??= browserFromUA(userAgent);
    os ??= osFromUA(userAgent);
  }

  return [browser, os].filter(Boolean).join(' – ');
}
