import { useTranslation } from 'react-i18next';

import type { WidgetConfigFormProps } from '../../lib/widget-config-form-registry';
import type { MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in config form for `MarkdownWidgetDefinition`. Edits the
 * `contentLocalizationKey` only — the actual Markdown body lives in the
 * app's i18n bundle (B5-A architecture: keys persist, content is a
 * tenant-overridable translation). Apps wanting an inline content editor
 * (writing Markdown directly into the dashboard JSON) register their own
 * form via `composeWidgetConfigFormRegistries`.
 */
export function MarkdownConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<MarkdownWidgetDefinition>) {
  const { t } = useTranslation();
  return (
    <div data-slot="markdown-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Markdown.ContentKey.Label')}
        </span>
        <input
          type="text"
          data-slot="markdown-content-key"
          value={widget.contentLocalizationKey}
          onChange={(event) => onChange({ ...widget, contentLocalizationKey: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}
