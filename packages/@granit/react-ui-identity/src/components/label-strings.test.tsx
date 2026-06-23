import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HookProviders } from '../__tests__/test-utils';

import { useDeviceLabelStrings } from './use-device-label-strings';
import { useDevicesCardLabels } from './use-devices-card-labels';
import { useRiskLabelStrings } from './use-risk-label-strings';
import { useSessionsCardLabels } from './use-sessions-card-labels';

const wrapper = HookProviders;

describe('useDeviceLabelStrings', () => {
  it('resolves the device kind labels and the "on" connector', () => {
    const { result } = renderHook(() => useDeviceLabelStrings(), { wrapper });
    expect(result.current.on).toBe('on');
    expect(result.current.kind.Browser).toBe('Browser');
    expect(result.current.kind.ApiClient).toBe('API client');
    expect(result.current.kind.Unknown).toBe('Unknown device');
  });
});

describe('useDevicesCardLabels', () => {
  it('uses the self-service title for the self scope', () => {
    const { result } = renderHook(() => useDevicesCardLabels('self'), { wrapper });
    expect(result.current.title).toBe('My devices');
    expect(result.current.empty).toBe('No device activity');
  });

  it('uses the admin title for the admin scope', () => {
    const { result } = renderHook(() => useDevicesCardLabels('admin'), { wrapper });
    expect(result.current.title).toBe('Device Activity');
  });

  it('pluralizes the session count', () => {
    const { result } = renderHook(() => useDevicesCardLabels('admin'), { wrapper });
    expect(result.current.sessionCount(1)).toBe('1 session');
    expect(result.current.sessionCount(3)).toBe('3 sessions');
  });
});

describe('useSessionsCardLabels', () => {
  it('uses the self title and "revoke all others" label for the self scope', () => {
    const { result } = renderHook(() => useSessionsCardLabels('self'), { wrapper });
    expect(result.current.title).toBe('My Sessions');
    expect(result.current.revokeAll).toBe('Revoke all others');
  });

  it('uses the admin title and "revoke all" label for the admin scope', () => {
    const { result } = renderHook(() => useSessionsCardLabels('admin'), { wrapper });
    expect(result.current.title).toBe('Active Sessions');
    expect(result.current.revokeAll).toBe('Revoke all');
  });
});

describe('useRiskLabelStrings', () => {
  it('resolves the title and known level/reason keys', () => {
    const { result } = renderHook(() => useRiskLabelStrings(), { wrapper });
    expect(result.current.title).toBe('Elevated risk');
    expect(result.current.level('High')).toBe('High');
    expect(result.current.reason('new_location')).toBe('New location');
  });

  it('humanizes an unknown reason code (underscores → words, capitalized)', () => {
    const { result } = renderHook(() => useRiskLabelStrings(), { wrapper });
    expect(result.current.reason('some_unmapped_code')).toBe('Some unmapped code');
  });

  it('falls back to the raw code when humanizing yields an empty string', () => {
    const { result } = renderHook(() => useRiskLabelStrings(), { wrapper });
    // A code made solely of separators humanizes to '' and must fall back to the raw token.
    expect(result.current.reason('___')).toBe('___');
  });
});
