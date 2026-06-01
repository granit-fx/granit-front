import { useTranslation } from 'react-i18next';

import type { WidgetConfigFormProps } from '../../lib/widget-config-form-registry';
import type { TextWidgetDefinition, TextWidgetStyle } from '@granit/dashboards';

const TEXT_STYLES: readonly TextWidgetStyle[] = ['Body', 'Heading', 'Subheading', 'Caption'];

/**
 * Built-in config form for `TextWidgetDefinition`. Edits the
 * `contentLocalizationKey` + the `style` enum (Body / Heading / Subheading
 * / Caption — PascalCase wire values per ADR-039 §6.1).
 */
export function TextConfigForm({ widget, onChange }: WidgetConfigFormProps<TextWidgetDefinition>) {
  const { t } = useTranslation();
  return (
    <div data-slot="text-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Text.ContentKey.Label')}
        </span>
        <input
          type="text"
          data-slot="text-content-key"
          value={widget.contentLocalizationKey}
          onChange={(event) => onChange({ ...widget, contentLocalizationKey: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Text.Style.Label')}
        </span>
        <select
          data-slot="text-style"
          value={widget.style}
          onChange={(event) =>
            onChange({ ...widget, style: event.target.value as TextWidgetStyle })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {TEXT_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
