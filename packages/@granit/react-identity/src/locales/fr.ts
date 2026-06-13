import type { IdentityTranslations } from './en';

/**
 * French translation bundle for `@granit/react-identity`. Consumers register
 * it via:
 *
 *   i18n.addResourceBundle('fr', 'identity', identityTranslationsFr);
 */
export const identityTranslationsFr: IdentityTranslations = {
  Device: {
    Kind: {
      Unknown: 'Appareil inconnu',
      Browser: 'Navigateur',
      BrowserExtension: 'Extension de navigateur',
      MobileApp: 'Application mobile',
      DesktopApp: 'Application de bureau',
      Wearable: 'Objet connecté',
      Tv: 'Téléviseur',
      Embedded: 'Appareil embarqué',
      ApiClient: 'Client API',
    },
    On: 'sur',
  },
};
