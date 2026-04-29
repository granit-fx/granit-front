import { useTranslation } from 'react-i18next';

import { useWidgetTriggerHandler } from '../../hooks/use-widget-trigger-handler.js';

import type { TextWidgetDefinition, TextWidgetStyle } from '@granit/dashboards';

const STYLE_CLASSES: Readonly<Record<TextWidgetStyle, string>> = {
  Body: 'text-sm text-foreground',
  Heading: 'text-2xl font-semibold tracking-tight text-foreground',
  Subheading: 'text-lg font-semibold text-foreground',
  Caption: 'text-xs text-muted-foreground',
};

/**
 * Built-in renderer for `TextWidgetDefinition`.
 *
 * Whitespace is preserved so multi-line text reads as authored. The
 * visual style (body / heading / subheading / caption) is mapped to
 * a Tailwind class set; consuming apps can override via the registry
 * for a custom design system.
 *
 * `Click` actions on `widget.actions` fire on body click via
 * {@link useWidgetTriggerHandler}. The element receives `role="button"`
 * and keyboard activation only when at least one Click action is
 * wired.
 */
export function TextWidget({ widget }: { readonly widget: TextWidgetDefinition }) {
  const { t } = useTranslation();
  const content = t(widget.contentLocalizationKey);
  const onClick = useWidgetTriggerHandler('Click', widget.actions);

  const baseClass = `whitespace-pre-wrap break-words ${STYLE_CLASSES[widget.style]}`;
  const className = onClick ? `${baseClass} cursor-pointer` : baseClass;
  const interactiveProps = onClick
    ? {
        onClick: () => onClick(),
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        },
        role: 'button' as const,
        tabIndex: 0,
      }
    : {};

  if (widget.style === 'Heading') {
    return (
      <h2 data-slot="text-widget" data-style="heading" className={className} {...interactiveProps}>
        {content}
      </h2>
    );
  }
  if (widget.style === 'Subheading') {
    return (
      <h3
        data-slot="text-widget"
        data-style="subheading"
        className={className}
        {...interactiveProps}
      >
        {content}
      </h3>
    );
  }
  return (
    <p
      data-slot="text-widget"
      data-style={widget.style.toLowerCase()}
      className={className}
      {...interactiveProps}
    >
      {content}
    </p>
  );
}
