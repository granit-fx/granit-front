import { toISODateString } from '@granit/types';

import type { MonitoringHealthResponse } from '@granit/diagnostics';

export const mockDiagnosticsHealth: MonitoringHealthResponse = {
  services: [
    {
      id: 'api-gateway',
      name: 'API Gateway',
      description: 'Main entry point for all API requests',
      status: 'healthy',
      responseTimeMs: 45,
      tags: ['readiness'],
    },
    {
      id: 'keycloak',
      name: 'Keycloak (IAM)',
      description: 'Identity and access management service',
      status: 'healthy',
      responseTimeMs: 112,
      tags: ['readiness', 'startup'],
    },
    {
      id: 'fhir-server',
      name: 'FHIR Server',
      description: 'FHIR R4 resource server for health data',
      status: 'degraded',
      responseTimeMs: 1850,
      tags: ['readiness'],
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      description: 'Primary database cluster',
      status: 'healthy',
      responseTimeMs: 8,
      tags: ['readiness', 'startup'],
    },
    {
      id: 'audit-service',
      name: 'Audit Service',
      description: 'Audit log recording and storage service',
      status: 'healthy',
      responseTimeMs: 23,
      tags: ['readiness'],
    },
    {
      id: 's3-storage',
      name: 'Object Storage (S3)',
      description: 'S3-compatible object storage for documents and files',
      status: 'healthy',
      responseTimeMs: 89,
      tags: ['readiness'],
    },
    {
      id: 'notification-service',
      name: 'Notification Service',
      description: 'Email and webhook notification delivery service',
      status: 'down',
      responseTimeMs: null,
      tags: ['readiness'],
    },
  ],
  checkedAt: toISODateString('2026-03-12T10:00:00Z'),
};
