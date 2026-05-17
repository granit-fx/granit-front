/** Query key factory for webhook queries. */
export const webhooksKeys = {
  all: ['webhooks'] as const,
  subscriptions: () => [...webhooksKeys.all, 'subscriptions'] as const,
  subscription: (id: string) => [...webhooksKeys.subscriptions(), id] as const,
  deliveries: (subscriptionId: string) =>
    [...webhooksKeys.subscription(subscriptionId), 'deliveries'] as const,
  stats: () => [...webhooksKeys.all, 'stats'] as const,
};
