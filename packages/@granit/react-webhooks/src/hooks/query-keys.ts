/** Query key factory for webhook queries. */
export const webhooksKeys = {
  all: ['webhooks'] as const,
  subscriptions: () => [...webhooksKeys.all, 'subscriptions'] as const,
  subscription: (id: string) => [...webhooksKeys.subscriptions(), id] as const,
  /** Signing keys of a subscription. */
  signingKeys: (subscriptionId: string) =>
    [...webhooksKeys.subscription(subscriptionId), 'keys'] as const,
  /**
   * Delivery attempts of a subscription. Matches the `queryKeyPrefix` consumers
   * pass to `@granit/react-query-engine` for the `/deliveries` grid, so a retry
   * mutation can invalidate it.
   */
  deliveries: (subscriptionId: string) =>
    [...webhooksKeys.all, 'deliveries', subscriptionId] as const,
  stats: () => [...webhooksKeys.all, 'stats'] as const,
};
