import { toISODateString } from '@granit/types';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { Mutable } from '@granit/testing';

export const mockBackgroundJobs: Mutable<BackgroundJobStatus>[] = [
  {
    jobName: 'vault-credential-renewal',
    cronExpression: '0 */30 * * * *',
    isEnabled: true,
    lastExecutedAt: toISODateString('2026-03-12T09:30:00Z'),
    nextExecutionAt: toISODateString('2026-03-12T10:00:00Z'),
    consecutiveFailures: 0,
    deadLetterCount: 0,
    lastError: null,
  },
  {
    jobName: 'audit-log-archival',
    cronExpression: '0 2 * * *',
    isEnabled: true,
    lastExecutedAt: toISODateString('2026-03-11T02:00:00Z'),
    nextExecutionAt: toISODateString('2026-03-12T02:00:00Z'),
    consecutiveFailures: 0,
    deadLetterCount: 0,
    lastError: null,
  },
  {
    jobName: 'keycloak-user-sync',
    cronExpression: '*/15 * * * *',
    isEnabled: true,
    lastExecutedAt: toISODateString('2026-03-12T09:45:00Z'),
    nextExecutionAt: toISODateString('2026-03-12T10:00:00Z'),
    consecutiveFailures: 2,
    deadLetterCount: 1,
    lastError: 'HttpRequestException: Connection refused (keycloak:8080)',
  },
  {
    jobName: 'gdpr-data-cleanup',
    cronExpression: '0 3 1 * *',
    isEnabled: false,
    lastExecutedAt: toISODateString('2026-02-01T03:00:00Z'),
    nextExecutionAt: null,
    consecutiveFailures: 0,
    deadLetterCount: 0,
    lastError: null,
  },
  {
    jobName: 'health-check-ping',
    cronExpression: '*/5 * * * *',
    isEnabled: true,
    lastExecutedAt: toISODateString('2026-03-12T09:55:00Z'),
    nextExecutionAt: toISODateString('2026-03-12T10:00:00Z'),
    consecutiveFailures: 0,
    deadLetterCount: 0,
    lastError: null,
  },
];
