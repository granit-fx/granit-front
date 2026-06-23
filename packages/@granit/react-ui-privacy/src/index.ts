// Pages — privacy self-service + admin DSR
export { PrivacyExportPage } from './privacy-export-page';
export { PrivacyDeletionPage } from './privacy-deletion-page';
export { PrivacyAgreementsPage } from './privacy-agreements-page';
export { PrivacyRegulationPage } from './privacy-regulation-page';
export { PrivacyOptOutPage } from './privacy-opt-out-page';
export { PrivacyAdminDsrPage } from './privacy-admin-dsr-page';

// Pages — legal document admin
export { LegalDocumentListPage } from './legal-documents/legal-document-list-page';
export { LegalDocumentCreatePage } from './legal-documents/legal-document-create-page';
export { LegalDocumentEditPage } from './legal-documents/legal-document-edit-page';

// Components
export { DeletionRequestTable } from './components/deletion-request-table';
export { DeletionStatusBadge } from './components/deletion-status-badge';
export { LegalDocumentForm } from './legal-documents/components/legal-document-form';
export { LegalDocumentPublishDialog } from './legal-documents/components/legal-document-publish-dialog';
export { LegalDocumentStatusBadge } from './legal-documents/components/legal-document-status-badge';
export { useLegalDocumentColumns } from './legal-documents/components/legal-document-columns';

// Form value types
export type {
  CreateLegalDocumentFormValues,
  EditLegalDocumentFormValues,
} from './legal-documents/validation';

// i18n bundles
export { privacyTranslationsEn, privacyTranslationsFr } from './locales';
