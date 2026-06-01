import type { EntitiesTranslations } from './en';

/**
 * French translation bundle for `@granit/react-entities`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('fr', 'entities', entitiesTranslationsFr);
 */
export const entitiesTranslationsFr: EntitiesTranslations = {
  SelectionBar: {
    SelectedSummary: '{{count}} sélectionnés',
    SelectedSummary_one: '1 sélectionné',
    SelectedSummary_other: '{{count}} sélectionnés',
    ClearSelection: 'Effacer la sélection',
  },
  BulkAction: {
    Recap: {
      Success: 'Les {{count}} lignes ont été traitées',
      Success_one: '1 ligne traitée',
      Success_other: 'Les {{count}} lignes ont été traitées',
      PartialFailure: '{{succeeded}} traitées, {{failed}} en échec',
      FullFailure: '{{count}} en échec',
      FullFailure_one: '1 en échec',
      FullFailure_other: '{{count}} en échec',
      Rejected: 'Action refusée — aucune ligne n’a pu être traitée',
    },
  },
};
