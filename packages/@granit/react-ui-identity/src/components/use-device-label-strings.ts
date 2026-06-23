import { useTranslation } from '@granit/react-localization';

import type { DeviceLabelStrings } from '@granit/identity';

/**
 * Build the localized {@link DeviceLabelStrings} for `composeDeviceLabel` from
 * the showcase's flat translation keys (`Users.Devices.Kind.*`, `Users.Devices.On`).
 */
export function useDeviceLabelStrings(): DeviceLabelStrings {
  const { t } = useTranslation();
  return {
    on: t('Users.Devices.On'),
    kind: {
      Unknown: t('Users.Devices.Kind.Unknown'),
      Browser: t('Users.Devices.Kind.Browser'),
      BrowserExtension: t('Users.Devices.Kind.BrowserExtension'),
      MobileApp: t('Users.Devices.Kind.MobileApp'),
      DesktopApp: t('Users.Devices.Kind.DesktopApp'),
      Wearable: t('Users.Devices.Kind.Wearable'),
      Tv: t('Users.Devices.Kind.Tv'),
      Embedded: t('Users.Devices.Kind.Embedded'),
      ApiClient: t('Users.Devices.Kind.ApiClient'),
    },
  };
}
