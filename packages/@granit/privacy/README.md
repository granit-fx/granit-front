# @granit/privacy

GDPR privacy types and API -- data export, deletion requests, legal agreement management. Mirrors `Granit.Privacy` .NET contract.

## Installation

```bash
pnpm add @granit/privacy
```

## API

### Types

- `PrivacyExportRequestResponse`, `PrivacyExportStatus`, `PrivacyExportStatusResponse` -- data export
- `PrivacyDeletionRequest`, `PrivacyDeletionResponse`, `DeletionStatusValue` -- deletion requests
- `AgreementStatus`, `AcceptAgreementRequest`, `AgreementHistoryEntry`, `LegalDocument` -- legal agreements

### Functions

- `requestExport(...)`, `listExports(...)`, `getExportStatus(...)` -- data export
- `requestDeletion(...)`, `listDeletions(...)`, `getDeletionStatus(...)`, `cancelDeletion(...)` -- deletion
- `getAgreementStatuses(...)`, `acceptAgreement(...)`, `getAgreementHistory(...)`, `getAgreementDocuments(...)` -- agreements

## Usage

```ts
import { requestExport, getAgreementStatuses } from '@granit/privacy';

const statuses = await getAgreementStatuses(client, basePath);
const exportRequest = await requestExport(client, basePath);
```

## License

Apache-2.0
