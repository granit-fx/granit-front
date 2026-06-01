'use client';

import type { MapBlockProps } from './types';

export function MapBlock({ title, address, lat, lng }: MapBlockProps) {
  return (
    <section data-block="map">
      {title && <h2>{title}</h2>}
      {address && <address>{address}</address>}
      {lat !== undefined && lng !== undefined && (
        <div data-lat={lat} data-lng={lng} aria-label={address ?? 'Map'} role="img" />
      )}
    </section>
  );
}
