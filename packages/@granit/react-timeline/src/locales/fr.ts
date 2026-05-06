import type { TimelineTranslations } from './en.js';

/**
 * French translation bundle for `@granit/react-timeline`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('fr', 'timeline', timelineTranslationsFr);
 */
export const timelineTranslationsFr: TimelineTranslations = {
  Reaction: {
    AriaLabel: 'Réagir avec {{emoji}}',
    Tooltip: {
      Count: '{{count}} réactions',
      Count_one: '1 réaction',
      Count_other: '{{count}} réactions',
    },
  },
};
