export const SubscriptionsPermissions = {
  Plans: {
    Read: 'Subscriptions.Plans.Read',
    Manage: 'Subscriptions.Plans.Manage',
  },
  Subscriptions: {
    Read: 'Subscriptions.Subscriptions.Read',
    Manage: 'Subscriptions.Subscriptions.Manage',
  },
  Prices: {
    Read: 'Subscriptions.Prices.Read',
    Manage: 'Subscriptions.Prices.Manage',
  },
  Seats: {
    Read: 'Subscriptions.Seats.Read',
    Manage: 'Subscriptions.Seats.Manage',
  },
} as const;
