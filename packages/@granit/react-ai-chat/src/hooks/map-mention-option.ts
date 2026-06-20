import type { MentionOption } from '../components/composer-types';
import type { MentionItem } from '@granit/mentions';

/**
 * Projects a generic {@link MentionItem} from `@granit/mentions` onto the composer's
 * {@link MentionOption}: the item's `email` (when present in `extra`) becomes the
 * secondary description line; other mention types render with no description.
 */
export function toMentionOption(item: MentionItem): MentionOption {
  return {
    type: item.type,
    id: item.id,
    label: item.label,
    description: typeof item.extra?.email === 'string' ? item.extra.email : null,
  };
}
