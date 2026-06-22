import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationAction } from '../components/notification-action';

import { renderNotifications } from './test-utils';

describe('NotificationAction', () => {
  it('should render an internal route as a router link', () => {
    renderNotifications(
      <NotificationAction action={{ label: 'View activity', to: '/activities?activityId=42' }} />
    );

    const link = screen.getByRole('link', { name: 'View activity' });
    expect(link).toHaveAttribute('href', '/activities?activityId=42');
    expect(link).not.toHaveAttribute('target');
  });

  it('should render an absolute URL as a new-tab anchor', () => {
    renderNotifications(
      <NotificationAction action={{ label: 'Open dashboard', to: 'https://example.com/x' }} />
    );

    const link = screen.getByRole('link', { name: /Open dashboard/ });
    expect(link).toHaveAttribute('href', 'https://example.com/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should invoke onActivate when clicked', () => {
    const onActivate = vi.fn();
    const { container } = renderNotifications(
      <NotificationAction action={{ label: 'Go', to: '/x' }} onActivate={onActivate} />
    );

    (container.querySelector('[data-slot="notification-action"]') as HTMLElement).click();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
