import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuditLogConfig } from '../providers/audit-log-provider';
import { AuditLogProvider } from '../providers/audit-log-provider';

import type { AuditLogProviderProps } from '../providers/audit-log-provider';
import type { AxiosInstance } from 'axios';

const mockConfig: AuditLogProviderProps['config'] = {
  client: {} as AxiosInstance,
  basePath: '/api/v1/auditing',
};

function createWrapper(config: AuditLogProviderProps['config']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuditLogProvider config={config}>{children}</AuditLogProvider>;
  };
}

describe('AuditLogProvider', () => {
  it('should provide config to children', () => {
    const { result } = renderHook(() => useAuditLogConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/v1/auditing');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuditLogConfig());
    }).toThrow('useAuditLogConfig must be used within an AuditLogProvider');
  });
});
