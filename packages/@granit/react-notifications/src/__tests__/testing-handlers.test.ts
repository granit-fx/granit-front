import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  createNotificationsHandlers,
  mockNotificationDefinitions,
  notificationQueryMetadata,
} from '../testing/index';

const BASE = 'http://api.test/api/v1';
const server = createMswServer();

describe('createNotificationsHandlers /meta', () => {
  it('responds with notificationQueryMetadata at /notifications/meta', async () => {
    server.use(...createNotificationsHandlers(BASE));
    const response = await fetch(`${BASE}/notifications/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(notificationQueryMetadata);
  });
});

describe('createNotificationsHandlers /types', () => {
  it('responds with the notification definition registry as a bare array', async () => {
    server.use(...createNotificationsHandlers(BASE));
    const response = await fetch(`${BASE}/notifications/types`);
    expect(response.status).toBe(200);
    const body = await response.json();
    // Contract: GET /notifications/types returns a bare JSON array, not an
    // envelope — the preferences panel calls `.filter` on it directly.
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual(mockNotificationDefinitions);
  });
});
