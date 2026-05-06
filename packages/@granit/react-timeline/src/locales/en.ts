/**
 * English translation bundle for `@granit/react-timeline`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('en', 'timeline', timelineTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly —
 * they expose `labels` props that apps populate from `t()` results.
 * This keeps components testable without an i18next bootstrap and
 * consistent with the headless conventions across the framework.
 *
 * Scope of the v1 catalog: surfaces shipped through the C-stream
 * (Reactions on Timeline). Future stories extend in place.
 */
export const timelineTranslationsEn: TimelineTranslations = {
  Reaction: {
    AriaLabel: 'React with {{emoji}}',
    Tooltip: {
      Count: '{{count}} reactions',
      Count_one: '1 reaction',
      Count_other: '{{count}} reactions',
    },
  },
};

export interface TimelineTranslations {
  readonly Reaction: {
    readonly AriaLabel: string;
    readonly Tooltip: {
      readonly Count: string;
      readonly Count_one: string;
      readonly Count_other: string;
    };
  };
}
