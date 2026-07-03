import {
  isAddressMapPointSource,
  isGeographyMapPointSource,
  isLatLngMapPointSource,
} from '@granit/analytics';
import { useQueryFieldMetadata } from '@granit/react-analytics/editor';
import {
  EnumSelect,
  MetaFieldInput,
  MetaMultiFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from '@granit/react-ui-analytics';
import { useTranslation } from 'react-i18next';

import type { MapTileLayerKind, MapWidgetDefinition } from '@granit/analytics';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const LAYER_KINDS: readonly MapTileLayerKind[] = ['Plan', 'Satellite', 'Hybrid', 'Topo', 'Custom'];

const POINT_SOURCE_KINDS = [
  { value: 'lat-lng', label: 'Lat / lng pair' },
  { value: 'geography', label: 'PostGIS geography column' },
  { value: 'address', label: 'Address (geocoded)' },
] as const;

type PointSourceKind = (typeof POINT_SOURCE_KINDS)[number]['value'];

/**
 * Built-in config form for {@link MapWidgetDefinition}. Edits the query
 * binding, point-source flavour (lat/lng pair vs PostGIS geography
 * column), comma-separated popup columns, default camera (zoom +
 * optional center), cluster threshold, optional detail-route + tile
 * provider override.
 *
 * Center coordinates accept either both lat + lng or neither (the
 * server-side validator rejects half-bound centers). Empty inputs
 * collapse the center to `null` so the snapshot renderer falls back to
 * fitting the bounding box of the rendered points.
 */
export function MapConfigForm({ widget, onChange }: WidgetConfigFormProps<MapWidgetDefinition>) {
  const { t } = useTranslation();
  const { pointSource } = widget;
  const { catalogEntries, columnOptions, geographyColumnOptions } = useQueryFieldMetadata(
    widget.queryName
  );

  const handlePointSourceKindChange = (kind: PointSourceKind) => {
    if (kind === 'lat-lng') {
      onChange({
        ...widget,
        pointSource: { kind: 'lat-lng', latitudeColumn: '', longitudeColumn: '' },
      });
    } else if (kind === 'geography') {
      onChange({ ...widget, pointSource: { kind: 'geography', geographyColumn: '' } });
    } else {
      onChange({
        ...widget,
        pointSource: {
          kind: 'address',
          streetColumn: '',
          postalCodeColumn: '',
          localityColumn: '',
          countryColumn: '',
        },
      });
    }
  };

  const center = widget.defaultCenter;

  return (
    <div data-slot="map-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.QueryName.Label')}
          <RequiredMark />
        </span>
        <QueryNameCombobox
          slot="map-query-name"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          required
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.PointSourceKind.Label')}
        </span>
        <EnumSelect
          slot="map-point-source-kind"
          value={pointSource.kind}
          options={POINT_SOURCE_KINDS}
          onChange={(value) => handlePointSourceKindChange(value as PointSourceKind)}
        />
      </label>

      {isLatLngMapPointSource(pointSource) && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.LatitudeColumn.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="map-latitude-column"
              value={pointSource.latitudeColumn}
              options={columnOptions}
              required
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, latitudeColumn: value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.LongitudeColumn.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="map-longitude-column"
              value={pointSource.longitudeColumn}
              options={columnOptions}
              required
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, longitudeColumn: value } })
              }
            />
          </label>
        </>
      )}

      {isGeographyMapPointSource(pointSource) && (
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Map.GeographyColumn.Label')}
            <RequiredMark />
          </span>
          <MetaFieldInput
            slot="map-geography-column"
            value={pointSource.geographyColumn}
            options={geographyColumnOptions}
            required
            onChange={(value) =>
              onChange({ ...widget, pointSource: { ...pointSource, geographyColumn: value } })
            }
          />
        </label>
      )}

      {isAddressMapPointSource(pointSource) && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.StreetColumn.Label')}
            </span>
            <MetaFieldInput
              slot="map-street-column"
              value={pointSource.streetColumn}
              options={columnOptions}
              allowEmpty
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, streetColumn: value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.PostalCodeColumn.Label')}
            </span>
            <MetaFieldInput
              slot="map-postal-code-column"
              value={pointSource.postalCodeColumn}
              options={columnOptions}
              allowEmpty
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, postalCodeColumn: value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.LocalityColumn.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="map-locality-column"
              value={pointSource.localityColumn}
              options={columnOptions}
              required
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, localityColumn: value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Map.CountryColumn.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="map-country-column"
              value={pointSource.countryColumn}
              options={columnOptions}
              required
              onChange={(value) =>
                onChange({ ...widget, pointSource: { ...pointSource, countryColumn: value } })
              }
            />
          </label>
        </>
      )}

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.PopupColumns.Label')}
        </span>
        <MetaMultiFieldInput
          slot="map-popup-columns"
          values={widget.popupColumns ?? []}
          options={columnOptions}
          placeholder="leave empty for no popup body"
          onChange={(values) =>
            onChange({ ...widget, popupColumns: values.length > 0 ? values : null })
          }
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.DefaultZoom.Label')}
        </span>
        <input
          type="number"
          data-slot="map-default-zoom"
          min={0}
          max={18}
          value={widget.defaultZoom ?? 5}
          onChange={(event) =>
            onChange({ ...widget, defaultZoom: Number.parseInt(event.target.value, 10) || 0 })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Map.DefaultCenter.Latitude.Label')}
          </span>
          <input
            type="number"
            data-slot="map-default-center-latitude"
            value={center?.latitude ?? ''}
            onChange={(event) => {
              const lat = event.target.value === '' ? null : Number.parseFloat(event.target.value);
              const lng = center?.longitude ?? null;
              onChange({
                ...widget,
                defaultCenter:
                  lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null,
              });
            }}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Map.DefaultCenter.Longitude.Label')}
          </span>
          <input
            type="number"
            data-slot="map-default-center-longitude"
            value={center?.longitude ?? ''}
            onChange={(event) => {
              const lng = event.target.value === '' ? null : Number.parseFloat(event.target.value);
              const lat = center?.latitude ?? null;
              onChange({
                ...widget,
                defaultCenter:
                  lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null,
              });
            }}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.ClusterThreshold.Label')}
        </span>
        <input
          type="number"
          data-slot="map-cluster-threshold"
          min={1}
          value={widget.clusterThreshold ?? 200}
          onChange={(event) =>
            onChange({ ...widget, clusterThreshold: Number.parseInt(event.target.value, 10) || 1 })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.DetailRoute.Label')}
        </span>
        <input
          type="text"
          data-slot="map-detail-route"
          value={widget.detailRoute ?? ''}
          placeholder="/customers/{id}"
          onChange={(event) =>
            onChange({
              ...widget,
              detailRoute: event.target.value === '' ? null : event.target.value,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.DefaultLayerKind.Label')}
        </span>
        <select
          data-slot="map-default-layer-kind"
          value={widget.defaultLayerKind ?? ''}
          onChange={(event) =>
            onChange({
              ...widget,
              defaultLayerKind:
                event.target.value === '' ? null : (event.target.value as MapTileLayerKind),
            })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">(provider default)</option>
          {LAYER_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Map.TileUrlTemplate.Label')}
        </span>
        <input
          type="text"
          data-slot="map-tile-url-template"
          value={widget.tileUrlTemplate ?? ''}
          placeholder="leave empty to use the active provider"
          onChange={(event) =>
            onChange({
              ...widget,
              tileUrlTemplate: event.target.value === '' ? null : event.target.value,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}
