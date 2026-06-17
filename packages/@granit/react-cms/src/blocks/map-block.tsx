'use client';

import type { MapBlockProps } from './types';

export function MapBlock({ latitude, longitude, zoom = 12, label }: MapBlockProps) {
  return (
    <section data-block="map">
      {label && <h2>{label}</h2>}
      {latitude !== undefined && longitude !== undefined && (
        <figure
          data-lat={latitude}
          data-lng={longitude}
          data-zoom={zoom}
          aria-label={label ?? 'Map'}
        />
      )}
    </section>
  );
}
