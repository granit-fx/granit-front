import type { FeatureDefinitionResponse, FeatureGroupResponse } from '@granit/features';

export const mockFeatureGroups: FeatureGroupResponse[] = [
  {
    name: 'billing',
    displayName: 'Billing',
    features: [
      {
        name: 'billing.auto-invoicing',
        displayName: 'Auto Invoicing',
        description: 'Automatically generate invoices on subscription renewal',
        valueType: 'Toggle',
        defaultValue: 'true',
        numericConstraint: null,
        selectionValues: null,
      },
      {
        name: 'billing.max-retry-attempts',
        displayName: 'Max Retry Attempts',
        description: 'Maximum payment retry attempts before marking as failed',
        valueType: 'Numeric',
        defaultValue: '3',
        numericConstraint: { min: 1, max: 10 },
        selectionValues: null,
      },
    ],
  },
  {
    name: 'ui',
    displayName: 'User Interface',
    features: [
      {
        name: 'ui.dark-mode',
        displayName: 'Dark Mode',
        description: 'Enable dark mode support',
        valueType: 'Toggle',
        defaultValue: 'true',
        numericConstraint: null,
        selectionValues: null,
      },
      {
        name: 'ui.theme',
        displayName: 'Theme',
        description: 'Active UI theme',
        valueType: 'Selection',
        defaultValue: 'default',
        numericConstraint: null,
        selectionValues: ['default', 'compact', 'comfortable'],
      },
    ],
  },
];

export const mockFeatureDefinitions: FeatureDefinitionResponse[] = mockFeatureGroups.flatMap(
  (g) => g.features
);

/**
 * Resolved feature values keyed by feature name — mirrors the backend
 * `GET /values` `IReadOnlyDictionary<string, string>` contract.
 */
export const mockFeatureValues: Record<string, string> = {
  'billing.auto-invoicing': 'true',
  'billing.max-retry-attempts': '3',
  'ui.dark-mode': 'true',
  'ui.theme': 'compact',
};
