// Form-value shapes for the tenant create/edit forms. Validation itself is
// spec-driven — derived from contracts/openapi/multi-tenancy.json via
// `multiTenancyConstraints` (@granit/multi-tenancy) and applied with
// `createConstraintsResolver` in tenant-form.tsx. These types only describe the
// always-present string inputs the form binds to (empty string when cleared);
// the create/edit pages coerce the nullable DTO fields on submit.

export interface CreateTenantFormValues {
  name: string;
  identifier: string;
  contactEmail: string;
  jurisdiction: string;
}

export interface EditTenantFormValues {
  name: string;
  contactEmail: string;
  jurisdiction: string;
}
