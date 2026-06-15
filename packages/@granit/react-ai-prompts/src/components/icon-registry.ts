import {
  Bell,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  FileText,
  Lightbulb,
  ListChecks,
  Mail,
  MessageSquare,
  PenLine,
  Search,
  Sparkles,
  Star,
  Tag,
  Zap,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/**
 * The front owns the prompt glyph set: the catalogue stores an icon
 * *identifier* string; this registry maps it to a rendered glyph. Extend it as
 * the showcase / apps need more icons — backend never sends a component.
 */
export const PROMPT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  calendar: Calendar,
  'file-text': FileText,
  'message-square': MessageSquare,
  search: Search,
  lightbulb: Lightbulb,
  'list-checks': ListChecks,
  mail: Mail,
  bell: Bell,
  star: Star,
  tag: Tag,
  zap: Zap,
  bot: Bot,
  'book-open': BookOpen,
  'pen-line': PenLine,
  brain: Brain,
};

/** The icon identifier used when a prompt has no icon or an unknown one. */
export const DEFAULT_PROMPT_ICON = 'sparkles';

/** Selectable icon identifiers, for the icon picker grid. */
export const PROMPT_ICON_IDS: readonly string[] = Object.keys(PROMPT_ICONS);

/** Resolve an icon identifier to a glyph, falling back to the default. */
export function getPromptIcon(icon: string | null | undefined): LucideIcon {
  return (icon ? PROMPT_ICONS[icon] : undefined) ?? PROMPT_ICONS[DEFAULT_PROMPT_ICON]!;
}
