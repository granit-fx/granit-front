import { useTranslation } from '@granit/react-localization';

import type { UserSessionRiskLevel } from '@granit/identity';

/** Turn a machine reason code (`new_location`) into a readable fallback ("New location"). */
function humanize(code: string): string {
  const text = code.replaceAll(/[_-]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : code;
}

export interface RiskLabelStrings {
  /** Heading for the indicator/tooltip, e.g. "Elevated risk". */
  readonly title: string;
  /** Localized name for a risk level (`Low`/`Medium`/`High`). */
  readonly level: (level: UserSessionRiskLevel) => string;
  /** Localized label for a reason code, humanized when no translation exists. */
  readonly reason: (code: string) => string;
}

/**
 * Localized strings for the session risk indicator, resolved from the showcase's
 * flat `Sessions.Risk.*` keys. Reason codes are backend-defined and open-ended,
 * so unknown codes fall back to a humanized form rather than showing the raw
 * snake_case token. Mirrors {@link useDeviceLabelStrings}.
 */
export function useRiskLabelStrings(): RiskLabelStrings {
  const { t } = useTranslation();
  return {
    title: t('Sessions.Risk.Title'),
    level: (level) => t(`Sessions.Risk.Level.${level}`),
    reason: (code) => t(`Sessions.Risk.Reason.${code}`, { defaultValue: humanize(code) }),
  };
}
