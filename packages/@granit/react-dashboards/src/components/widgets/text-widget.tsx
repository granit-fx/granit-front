import { useTranslation } from 'react-i18next';

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
 * Whitespace is preserved so multi-line text reads as authored. The visual
 * style (body / heading / subheading / caption) is mapped to a Tailwind class
 * set; consuming apps can override via the registry for a custom design system.
 */
export function TextWidget({ widget }: { readonly widget: TextWidgetDefinition }) {
  const { t } = useTranslation();
  const content = t(widget.contentLocalizationKey);
  const className = `whitespace-pre-wrap break-words ${STYLE_CLASSES[widget.style]}`;

  if (widget.style === 'Heading') {
    return (
      <h2 data-slot="text-widget" data-style="heading" className={className}>
        {content}
      </h2>
    );
  }
  if (widget.style === 'Subheading') {
    return (
      <h3 data-slot="text-widget" data-style="subheading" className={className}>
        {content}
      </h3>
    );
  }
  return (
    <p data-slot="text-widget" data-style={widget.style.toLowerCase()} className={className}>
      {content}
    </p>
  );
}
