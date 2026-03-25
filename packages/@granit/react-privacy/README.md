# @granit/react-privacy

React hooks for `@granit/privacy` -- data export, deletion requests, legal agreement management.

## Installation

```bash
pnpm add @granit/react-privacy
```

## API

### Components

- `PrivacyProvider` -- provides privacy configuration to the component tree

### Hooks

- `usePrivacyConfig()` -- access privacy configuration from context
- `usePrivacyExports()`, `usePrivacyExportStatus(id)`, `useRequestExport()` -- data export
- `useDeletionRequests()`, `useDeletionStatus(id)`, `useRequestDeletion()`, `useCancelDeletion()` -- data deletion
- `useAgreementStatuses()`, `useAcceptAgreement()`, `useAgreementHistory(id)`, `useAgreementDocuments()` -- legal agreements

## Usage

```tsx
import { PrivacyProvider, useAgreementStatuses, useRequestExport } from '@granit/react-privacy';

function App() {
  return (
    <PrivacyProvider client={axiosInstance} basePath="/api/privacy">
      <PrivacySettings />
    </PrivacyProvider>
  );
}

function PrivacySettings() {
  const { data: statuses } = useAgreementStatuses();
  const { mutate: requestExport } = useRequestExport();

  return <button onClick={() => requestExport()}>Export my data</button>;
}
```

## License

Apache-2.0
