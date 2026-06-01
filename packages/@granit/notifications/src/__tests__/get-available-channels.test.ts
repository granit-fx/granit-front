import { describe, expect, it } from 'vitest';

import { NotificationChannels } from '../types/index';

describe('NotificationChannels', () => {
  it('should use PascalCase values matching .NET backend', () => {
    expect(NotificationChannels.InApp).toBe('InApp');
    expect(NotificationChannels.Email).toBe('Email');
    expect(NotificationChannels.Sms).toBe('Sms');
    expect(NotificationChannels.WhatsApp).toBe('WhatsApp');
    expect(NotificationChannels.Push).toBe('Push');
    expect(NotificationChannels.MobilePush).toBe('MobilePush');
    expect(NotificationChannels.Sse).toBe('Sse');
    expect(NotificationChannels.SignalR).toBe('SignalR');
    expect(NotificationChannels.Zulip).toBe('Zulip');
  });

  it('should contain all 9 well-known channels', () => {
    expect(Object.keys(NotificationChannels)).toHaveLength(9);
  });
});
