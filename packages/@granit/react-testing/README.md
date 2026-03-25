# @granit/react-testing

React test utilities for `@granit/*` packages -- TanStack Query test helpers. Re-exports `@granit/testing`.

## Installation

```bash
pnpm add -D @granit/react-testing
```

## API

### Functions (from `@granit/testing`)

- `createMockClient()` -- create a mocked Axios instance
- `axiosResponse(data, status?)` -- build an `AxiosResponse` for assertions
- `createMockLogger()` -- create a mock logger

### Functions (React-specific)

- `createTestQueryClient()` -- create a `QueryClient` configured for tests (no retries, no GC)
- `createQueryWrapper()` -- create a React wrapper component with `QueryClientProvider`

## Usage

```tsx
import { createMockClient, createQueryWrapper } from '@granit/react-testing';
import { renderHook, waitFor } from '@testing-library/react';

const client = createMockClient();
const wrapper = createQueryWrapper();

const { result } = renderHook(() => useMyHook(), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

## License

Apache-2.0
