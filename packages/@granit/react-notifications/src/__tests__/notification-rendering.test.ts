import { describe, expect, it } from 'vitest';

import { presentDefault } from '../rendering/default-view';
import { registerNotificationView } from '../rendering/registry';
import { resolveNotificationPresentation } from '../rendering/resolve';

import type { NotificationPresentContext, PresentableNotification } from '../rendering/types';

const ctx: NotificationPresentContext = { t: (key, options) => options?.defaultValue ?? key };

function notification(overrides: Partial<PresentableNotification>): PresentableNotification {
  return {
    notificationTypeName: 'Unknown.Type',
    severity: 'Info',
    data: {},
    relatedEntityType: null,
    relatedEntityId: null,
    ...overrides,
  };
}

describe('notification rendering', () => {
  describe('presentDefault', () => {
    it('should read title/body from the payload', () => {
      const result = presentDefault(notification({ data: { title: 'Hi', body: 'There' } }));
      expect(result).toMatchObject({ title: 'Hi', body: 'There' });
    });

    it('should degrade to the type name when title is missing or non-string', () => {
      expect(presentDefault(notification({ notificationTypeName: 'A.B', data: {} })).title).toBe(
        'A.B'
      );
      expect(
        presentDefault(notification({ notificationTypeName: 'A.B', data: { title: 42 } })).title
      ).toBe('A.B');
    });
  });

  describe('resolveNotificationPresentation', () => {
    it('should fall back to the default view for an unregistered type', () => {
      const result = resolveNotificationPresentation(
        notification({ notificationTypeName: 'Not.Registered', data: { title: 'X' } }),
        ctx
      );
      expect(result.title).toBe('X');
      expect(result.action).toBeUndefined();
    });

    it('should use a registered view and pass it through the translate context', () => {
      registerNotificationView<{ name: string }>({
        code: 'Test.Registered',
        parse: (data) => {
          const d = data as { name?: unknown };
          return typeof d.name === 'string' ? { name: d.name } : null;
        },
        present: (data, _n, c) => ({
          title: data.name,
          action: { label: c.t('Generic.Open', { defaultValue: 'Open' }), to: '/somewhere' },
        }),
      });

      const result = resolveNotificationPresentation(
        notification({ notificationTypeName: 'Test.Registered', data: { name: 'Widget' } }),
        ctx
      );

      expect(result.title).toBe('Widget');
      expect(result.action).toEqual({ label: 'Open', to: '/somewhere' });
    });

    it('should fall back to the default view when a registered payload fails validation', () => {
      registerNotificationView<{ name: string }>({
        code: 'Test.Strict',
        parse: (data) => {
          const d = data as { name?: unknown };
          return typeof d.name === 'string' ? { name: d.name } : null;
        },
        present: (data) => ({ title: data.name }),
      });

      const result = resolveNotificationPresentation(
        notification({
          notificationTypeName: 'Test.Strict',
          data: { name: 123, body: 'fallback body' },
        }),
        ctx
      );

      expect(result.title).toBe('Test.Strict');
      expect(result.body).toBe('fallback body');
    });
  });
});
