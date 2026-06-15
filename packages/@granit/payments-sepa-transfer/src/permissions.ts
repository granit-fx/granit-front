/**
 * SEPA bank transfer permissions. Mirrors the backend `SepaTransferPermissions`.
 */
export const SepaTransferPermissions = {
  Configuration: {
    Manage: 'SepaTransfer.Configuration.Manage',
  },
} as const;
