/**
 * English translation bundle for `@granit/react-entities`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('en', 'entities', entitiesTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly —
 * they expose `labels` props (when needed) that apps populate from
 * `t()` calls. This keeps components testable without an i18next
 * bootstrap and consistent with the headless conventions of the rest
 * of the framework (see `@granit/react-activities`).
 *
 * Scope of the v1 catalog: surfaces shipped through Phase 2 streams
 * (selection bar + bulk action recap UX). Future stories extend the
 * bundle in place.
 */
export const entitiesTranslationsEn: EntitiesTranslations = {
  SelectionBar: {
    SelectedSummary: '{{count}} selected',
    SelectedSummary_one: '1 selected',
    SelectedSummary_other: '{{count}} selected',
    ClearSelection: 'Clear selection',
  },
  BulkAction: {
    Recap: {
      Success: 'All {{count}} succeeded',
      Success_one: '1 succeeded',
      Success_other: 'All {{count}} succeeded',
      PartialFailure: '{{succeeded}} succeeded, {{failed}} failed',
      FullFailure: '{{count}} failed',
      FullFailure_one: '1 failed',
      FullFailure_other: '{{count}} failed',
      Rejected: 'Action rejected — none of the rows could be processed',
    },
  },
};

export interface EntitiesTranslations {
  readonly SelectionBar: {
    readonly SelectedSummary: string;
    readonly SelectedSummary_one: string;
    readonly SelectedSummary_other: string;
    readonly ClearSelection: string;
  };
  readonly BulkAction: {
    readonly Recap: {
      readonly Success: string;
      readonly Success_one: string;
      readonly Success_other: string;
      readonly PartialFailure: string;
      readonly FullFailure: string;
      readonly FullFailure_one: string;
      readonly FullFailure_other: string;
      readonly Rejected: string;
    };
  };
}
