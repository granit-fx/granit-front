import { useTranslation } from 'react-i18next';

import type { WidgetConfigFormProps } from '../../lib/widget-config-form-registry.js';
import type { ImageFit, ImageWidgetDefinition } from '@granit/dashboards';

const IMAGE_FITS: readonly ImageFit[] = ['Contain', 'Cover', 'Fill'];

/**
 * Built-in config form for `ImageWidgetDefinition`. Edits the source URL
 * (or blob reference), the alt-text localization key, and the
 * cell-fitting strategy (PascalCase wire values).
 */
export function ImageConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<ImageWidgetDefinition>) {
  const { t } = useTranslation();
  return (
    <div data-slot="image-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Image.Source.Label')}
        </span>
        <input
          type="text"
          data-slot="image-source"
          value={widget.source}
          onChange={(event) => onChange({ ...widget, source: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Image.AltKey.Label')}
        </span>
        <input
          type="text"
          data-slot="image-alt-key"
          value={widget.altLocalizationKey}
          onChange={(event) => onChange({ ...widget, altLocalizationKey: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Image.Fit.Label')}
        </span>
        <select
          data-slot="image-fit"
          value={widget.fit ?? 'Contain'}
          onChange={(event) => onChange({ ...widget, fit: event.target.value as ImageFit })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {IMAGE_FITS.map((fit) => (
            <option key={fit} value={fit}>
              {fit}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
