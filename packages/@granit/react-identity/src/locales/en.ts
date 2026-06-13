/**
 * English translation bundle for `@granit/react-identity`. Consumers register
 * it via:
 *
 *   i18n.addResourceBundle('en', 'identity', identityTranslationsEn);
 *
 * Components in this package stay headless — they expose `labels` props that
 * apps populate from `t()`. The `Device` section feeds `composeDeviceLabel`
 * from `@granit/identity` (build a `DeviceLabelStrings` from `Device.Kind` +
 * `Device.On`).
 */
export const identityTranslationsEn = {
  Device: {
    /** One entry per `DeviceKind`. */
    Kind: {
      Unknown: 'Unknown device',
      Browser: 'Browser',
      BrowserExtension: 'Browser extension',
      MobileApp: 'Mobile app',
      DesktopApp: 'Desktop app',
      Wearable: 'Wearable',
      Tv: 'TV',
      Embedded: 'Embedded device',
      ApiClient: 'API client',
    },
    /** Connector composed as "{client} on {os}". */
    On: 'on',
  },
};

export type IdentityTranslations = typeof identityTranslationsEn;
