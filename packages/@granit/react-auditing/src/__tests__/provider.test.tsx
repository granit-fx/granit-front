import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuditLogConfig } from '../providers/audit-log-provider.js';
import { AuditLogProvider } from '../providers/audit-log-provider.js';

import type { AuditLogConfig } from '../providers/audit-log-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: AuditLogConfig = {
  client: {} as AxiosInstance,
  basePath: '/audit-log',
};

function createWrapper(config: AuditLogConfig) {
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
    expect(result.current.basePath).toBe('/audit-log');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuditLogConfig());
    }).toThrow('useAuditLogConfig must be used within an AuditLogProvider');
  });
});
