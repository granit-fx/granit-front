import { useTranslation } from 'react-i18next';

import type { WidgetConfigFormRegistry } from '../lib/widget-config-form-registry';
import type { WidgetDefinition } from '@granit/dashboards';
import type { ReactNode } from 'react';

/**
 * Drawer surface that picks the right config form for a widget's `type`
 * and renders it. The drawer is presentational — apps own its open / close
 * state, animation, and side-panel chrome (Sheet, Drawer, Dialog, etc.).
 *
 * The `widget` prop drives which form renders; the `onChange` prop is
 * forwarded to the matched form so each emit goes back through the same
 * controlled-state pipeline. The drawer title surfaces the widget slug —
 * stable across reorders, matches what the read-mode renderer keys off.
 *
 * Unknown widget kinds (no entry in the registry) surface a localized
 * fallback message — same behaviour as the read-mode "Unknown widget
 * type" placeholder, so authoring + rendering stay symmetric.
 */
export interface WidgetConfigDrawerProps {
  readonly widget: WidgetDefinition;
  readonly onChange: (next: WidgetDefinition) => void;
  readonly registry: WidgetConfigFormRegistry;
  readonly className?: string;
  /**
   * Optional header slot — apps render their own close button / save
   * button here. The drawer renders nothing of its own beyond the title +
   * the form.
   */
  readonly header?: ReactNode;
}

export function WidgetConfigDrawer({
  widget,
  onChange,
  registry,
  className,
  header,
}: WidgetConfigDrawerProps) {
  const { t } = useTranslation();
  const Form = registry[widget.type];

  return (
    <div
      data-slot="widget-config-drawer"
      data-widget-slug={widget.slug}
      data-widget-type={widget.type}
      className={className}
    >
      <div data-slot="widget-config-drawer-header" className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{widget.slug}</h2>
        {header}
      </div>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Title.Label', { defaultValue: 'Title' })}
        </span>
        <input
          type="text"
          data-slot="widget-title"
          value={widget.titleLocalizationKey ?? ''}
          onChange={(event) =>
            onChange({
              ...widget,
              titleLocalizationKey: event.target.value === '' ? undefined : event.target.value,
            })
          }
          placeholder={t('Dashboard:Widget.Title.Placeholder', { defaultValue: 'Widget title' })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      {Form ? (
        <Form widget={widget} onChange={onChange} />
      ) : (
        <p data-slot="widget-config-drawer-fallback" className="text-sm text-muted-foreground">
          {t('Dashboard:Widget.UnknownType', { type: widget.type })}
        </p>
      )}
    </div>
  );
}
