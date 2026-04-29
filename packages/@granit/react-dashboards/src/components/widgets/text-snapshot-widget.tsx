import { isTextSnapshotEnvelope } from '@granit/dashboards';
import { useTranslation } from 'react-i18next';

import type { DashboardRenderedWidget, TextWidgetStyle } from '@granit/dashboards';

const STYLE_CLASSES: Readonly<Record<TextWidgetStyle, string>> = {
  Body: 'text-sm text-foreground',
  Heading: 'text-2xl font-semibold tracking-tight text-foreground',
  Subheading: 'text-lg font-semibold text-foreground',
  Caption: 'text-xs text-muted-foreground',
};

/**
 * Built-in snapshot renderer for the `'Text'` widget kind. Symmetric to the
 * definition-side {@link TextWidget}: uses the same Tailwind class set and
 * the same `<h2>` / `<h3>` / `<p>` HTML element switch.
 */
export function TextSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  const { t } = useTranslation();
  if (!isTextSnapshotEnvelope(widget) || !widget.snapshot) return null;
  const { contentLocalizationKey, style } = widget.snapshot;
  const content = t(contentLocalizationKey, { defaultValue: contentLocalizationKey });
  const className = `whitespace-pre-wrap break-words ${STYLE_CLASSES[style]}`;

  if (style === 'Heading') {
    return (
      <h2 data-slot="text-snapshot-widget" data-style="heading" className={className}>
        {content}
      </h2>
    );
  }
  if (style === 'Subheading') {
    return (
      <h3 data-slot="text-snapshot-widget" data-style="subheading" className={className}>
        {content}
      </h3>
    );
  }
  return (
    <p data-slot="text-snapshot-widget" data-style={style.toLowerCase()} className={className}>
      {content}
    </p>
  );
}
