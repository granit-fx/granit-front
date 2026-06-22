// @granit/react-ui-diagnostics — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { diagnosticsTranslationsEn } from "@granit/react-ui-diagnostics";
//   i18n.addResourceBundle("en", "translation", diagnosticsTranslationsEn, true, true);

export const diagnosticsTranslationsEn = {
  'Diagnostics.AutoRefresh': 'Auto-refreshes in {{seconds}}s',
  'Diagnostics.LastChecked': 'Last checked {{time}}',
  'Diagnostics.RefreshAriaLabel': 'Refresh diagnostics data',
  'Diagnostics.ResponseTime': '{{ms}}ms',
  'Diagnostics.ServiceUnreachable': 'Service unreachable',
  'Diagnostics.Status.degraded': 'Degraded',
  'Diagnostics.Status.down': 'Down',
  'Diagnostics.Status.healthy': 'Healthy',
  'Diagnostics.Subtitle': 'System health and service status overview',
  'Diagnostics.Title': 'Monitoring',
} as const;

export type DiagnosticsTranslations = typeof diagnosticsTranslationsEn;
