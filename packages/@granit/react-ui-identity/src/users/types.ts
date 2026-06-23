/**
 * Showcase admin user — extends the base IdentityUser fields with all
 * optional properties typed as required for convenience in admin views.
 */
export type AdminUser = {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly username: string;
  readonly enabled: boolean;
};
