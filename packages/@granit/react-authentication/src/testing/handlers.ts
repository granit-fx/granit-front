import { http, HttpResponse } from 'msw';

import { mockBffSessions } from './data';

/**
 * Create stateful MSW handlers for authentication endpoints.
 *
 * Covers:
 * - `GET /me` — returns the full permission set for the current user
 * - BFF session endpoints — list, delete single, delete all
 *
 * @param baseUrl       - Auth API base path (default: `/api/v1/auth`)
 * @param bffSessionsUrl - BFF sessions endpoint (default: `/bff/sessions`).
 *                        Pass the full prefix for host/tenant apps, e.g. `/host/bff/sessions`.
 */
export function createAuthHandlers(baseUrl = '/api/v1/auth', bffSessionsUrl = '/bff/sessions') {
  return [
    http.get(`${baseUrl}/me`, () => {
      return HttpResponse.json({
        permissions: [
          // Showcase (application)
          'Showcase.Users.Read',
          'Showcase.Users.Manage',
          'Showcase.Countries.Read',
          'Showcase.Countries.Manage',
          'Showcase.ReferenceData.Read',
          'Showcase.ReferenceData.Manage',
          // Granit (framework) — [Group].[Resource].[Action]
          'AI.Workspaces.Read',
          'AI.Workspaces.Manage',
          'AI.Usage.Read',
          'AI.Chat.Execute',
          'AI.Embeddings.Execute',
          'AuthenticationApiKeys.Keys.Read',
          'AuthenticationApiKeys.Keys.Create',
          'AuthenticationApiKeys.Keys.Revoke',
          'AuthenticationApiKeys.Keys.Rotate',
          'AuthenticationApiKeys.Keys.UpdateScopes',
          'Authorization.Definitions.Read',
          'Authorization.Grants.Manage',
          'BackgroundJobs.Jobs.Read',
          'BackgroundJobs.Jobs.Manage',
          'BlobStorage.Administration.Read',
          'BlobStorage.Administration.Manage',
          'DataExchange.Imports.Read',
          'DataExchange.Imports.Execute',
          'DataExchange.Exports.Read',
          'DataExchange.Exports.Execute',
          'Diagnostics.Monitoring.Read',
          'Features.Flags.Read',
          'Features.Flags.Manage',
          'Identity.Groups.Read',
          'Identity.Groups.Manage',
          'Identity.Passwords.Manage',
          'Identity.Roles.Read',
          'Identity.Roles.Manage',
          'Identity.Sessions.Read',
          'Identity.Sessions.Manage',
          'Identity.Users.Read',
          'Identity.Users.Manage',
          'Identity.Users.Sync',
          'Identity.Users.Delete',
          'Localization.Overrides.Read',
          'Localization.Overrides.Manage',
          'Notifications.UserNotifications.Read',
          'Notifications.UserNotifications.Manage',
          'Privacy.LegalDocuments.Read',
          'Privacy.LegalDocuments.Create',
          'Privacy.LegalDocuments.Manage',
          'Settings.Global.Read',
          'Settings.Global.Manage',
          'Settings.Tenant.Read',
          'Settings.Tenant.Manage',
          'Templating.Templates.Read',
          'Templating.Templates.Manage',
          'Auditing.AuditEntries.Read',
          'Auditing.AuditEntries.Create',
          'Webhooks.Subscriptions.Read',
          'Webhooks.Subscriptions.Manage',
          'Workflow.History.Read',
          'Workflow.Transitions.Read',
          // SaaS / Host modules
          'MultiTenancy.Tenants.Read',
          'MultiTenancy.Tenants.Create',
          'MultiTenancy.Tenants.Update',
          'MultiTenancy.Tenants.Activate',
          'MultiTenancy.Tenants.Deactivate',
          'Subscriptions.Subscriptions.Read',
          'Subscriptions.Subscriptions.Create',
          'Subscriptions.Subscriptions.Update',
          'Subscriptions.Plans.Read',
          'Subscriptions.Plans.Create',
          'Subscriptions.Plans.Publish',
          'Subscriptions.Plans.Archive',
          'Invoicing.Invoices.Read',
          'Invoicing.Invoices.Create',
          'Payments.Transactions.Read',
          'Payments.Transactions.Create',
          'Payments.Transactions.Refund',
          'Payments.Methods.Read',
          'Payments.Methods.Write',
          'CustomerBalance.Balance.Read',
          'CustomerBalance.Balance.Write',
          'Metering.Meters.Read',
          'Metering.Meters.Create',
          'Metering.Meters.Deactivate',
          'Tax.Rates.Read',
          'Tax.Rates.Validate',
          'Features.Definitions.Read',
          'Features.Definitions.Override',
          'Workflow.Transitions.Execute',
        ],
      });
    }),

    // BFF session endpoints
    http.get(bffSessionsUrl, () => {
      return HttpResponse.json(mockBffSessions);
    }),

    http.delete(`${bffSessionsUrl}/:sessionId`, () => {
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(bffSessionsUrl, () => {
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
