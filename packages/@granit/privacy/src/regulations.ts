export const PRIVACY_REGULATIONS = [
  // Tier 1 — Major jurisdictions
  { code: 'EU_GDPR', displayName: 'EU — GDPR', tier: 1 as const },
  { code: 'UK_GDPR', displayName: 'UK — UK GDPR', tier: 1 as const },
  { code: 'BR_LGPD', displayName: 'Brazil — LGPD', tier: 1 as const },
  { code: 'US_CCPA', displayName: 'California (US) — CCPA', tier: 1 as const },
  { code: 'CA_PIPEDA', displayName: 'Canada — PIPEDA', tier: 1 as const },
  { code: 'CA_QUEBEC_25', displayName: 'Québec (CA) — Law 25', tier: 1 as const },
  { code: 'CH_NFADP', displayName: 'Switzerland — nFADP', tier: 1 as const },
  // Tier 2 — Additional jurisdictions
  { code: 'CN_PIPL', displayName: 'China — PIPL', tier: 2 as const },
  { code: 'IN_DPDPA', displayName: 'India — DPDPA', tier: 2 as const },
  { code: 'JP_APPI', displayName: 'Japan — APPI', tier: 2 as const },
  { code: 'KR_PIPA', displayName: 'South Korea — PIPA', tier: 2 as const },
  { code: 'AU_PRIVACY_ACT', displayName: 'Australia — Privacy Act', tier: 2 as const },
  { code: 'ZA_POPIA', displayName: 'South Africa — POPIA', tier: 2 as const },
  { code: 'TH_PDPA', displayName: 'Thailand — PDPA', tier: 2 as const },
] as const;

export type PrivacyRegulationCode = (typeof PRIVACY_REGULATIONS)[number]['code'];
