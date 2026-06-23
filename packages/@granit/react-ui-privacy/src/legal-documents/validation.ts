// Form value types for the legal-document admin forms. Validation is now
// spec-driven via createConstraintsResolver(privacyConstraints.*) in
// legal-document-form.tsx — these interfaces mirror the LegalDocumentCreateRequest /
// LegalDocumentUpdateRequest DTO shapes the forms collect.

export interface CreateLegalDocumentFormValues {
  readonly documentId: string;
  readonly displayName: string;
  readonly description?: string;
  readonly templateName?: string;
}

export interface EditLegalDocumentFormValues {
  readonly displayName: string;
  readonly description?: string;
  readonly templateName?: string;
  readonly documentBlobId?: string;
  readonly concurrencyStamp: string;
}
