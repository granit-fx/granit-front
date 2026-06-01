import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  MapTileProviderProvider,
  useMapTileProvider,
} from '../components/map-tile-provider-context';
import { osmProvider } from '../providers/osm-provider';
import { spwProvider } from '../providers/spw-provider';

import type { ReactNode } from 'react';

describe('MapTileProvider context', () => {
  it('falls back to osmProvider when no provider context is mounted', () => {
    const { result } = renderHook(() => useMapTileProvider());
    expect(result.current).toBe(osmProvider);
  });

  it('returns the active provider when wrapped', () => {
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <MapTileProviderProvider provider={spwProvider}>{children}</MapTileProviderProvider>
    );
    const { result } = renderHook(() => useMapTileProvider(), { wrapper });
    expect(result.current).toBe(spwProvider);
    expect(result.current.id).toBe('spw');
  });
});
