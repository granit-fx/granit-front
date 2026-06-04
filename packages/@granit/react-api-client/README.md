<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/react-api-client

React context provider for sharing a single Axios instance across all Granit
framework providers and hooks.

Part of the [Granit](https://granit-fx.dev) framework.

## Usage

Place `GranitClientProvider` at the root of your app so that domain providers
(`QueryProvider`, `DataExchangeProvider`, …) resolve the client from context
instead of receiving it in every config object.

```tsx
import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';

const api = createApiClient({ baseURL: '/api' });

<GranitClientProvider client={api}>
  <App />
</GranitClientProvider>;
```

Consume the shared client inside framework packages or application code:

```tsx
import { useGranitClient, useOptionalGranitClient } from '@granit/react-api-client';

const client = useGranitClient(); // throws if no provider is mounted
const maybe = useOptionalGranitClient(); // null when no provider — `config.client ?? context`
```

## Installation

Consumed via `link:` protocol — see the [integration documentation](https://granit-fx.dev).

## Documentation

See the [full documentation](https://granit-fx.dev/frontend/api/http-client/).
