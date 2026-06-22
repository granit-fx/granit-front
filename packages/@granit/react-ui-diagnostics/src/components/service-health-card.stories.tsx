import { ServiceHealthCard } from './service-health-card';

import type { ServiceHealthResponse } from '@granit/diagnostics';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ServiceHealthCard> = {
  title: 'Diagnostics/ServiceHealthCard',
  component: ServiceHealthCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    service: { control: 'object' },
    checkedAt: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceHealthCard>;

const checkedAt = '2026-06-20T14:30:00Z';

const baseService: ServiceHealthResponse = {
  id: 'api-gateway',
  name: 'API Gateway',
  description: 'Main entry point of the Granit REST API',
  status: 'healthy',
  responseTimeMs: 42,
  tags: ['readiness'],
};

export const Healthy: Story = {
  args: { service: { ...baseService, status: 'healthy', responseTimeMs: 42 }, checkedAt },
};

export const Degraded: Story = {
  args: {
    service: {
      ...baseService,
      id: 'fhir-server',
      name: 'FHIR R4 Server',
      description: 'FHIR server for structured health data',
      status: 'degraded',
      responseTimeMs: 850,
      tags: ['readiness', 'startup'],
    },
    checkedAt,
  },
};

export const Down: Story = {
  args: {
    service: {
      ...baseService,
      id: 'notification-service',
      name: 'Notification Service',
      description: 'Push and email notification delivery',
      status: 'down',
      responseTimeMs: null,
      tags: ['readiness'],
    },
    checkedAt,
  },
};

export const NoResponseTime: Story = {
  args: {
    service: { ...baseService, status: 'degraded', responseTimeMs: null, tags: ['readiness'] },
    checkedAt,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ServiceHealthCard
        service={{ ...baseService, status: 'healthy', responseTimeMs: 42 }}
        checkedAt={checkedAt}
      />
      <ServiceHealthCard
        service={{
          ...baseService,
          id: 'fhir',
          name: 'FHIR R4 Server',
          status: 'degraded',
          responseTimeMs: 920,
          tags: ['readiness', 'startup'],
        }}
        checkedAt={checkedAt}
      />
      <ServiceHealthCard
        service={{
          ...baseService,
          id: 'notif',
          name: 'Notification Service',
          status: 'down',
          responseTimeMs: null,
          tags: ['readiness'],
        }}
        checkedAt={checkedAt}
      />
    </div>
  ),
  parameters: { layout: 'padded' },
};
