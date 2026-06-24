# @granit/react-testing

React test utilities for `@granit/*` packages — the React-aware companion to the
framework-agnostic [`@granit/testing`](../testing). This is a **tooling** package
(consumed only from test code, never shipped in app runtime). It adds a TanStack
Query `QueryClient` factory tuned for tests, a `QueryClientProvider` wrapper, and a
small provider-composition helper, then re-exports everything from
[`@granit/testing`](../testing) so a test file imports both layers from one entry.

The split is two packages:

- [`@granit/testing`](../testing) — framework-agnostic core: mocked `AxiosInstance`,
  `AxiosResponse` builder, mock `Logger`, plus `./msw`, `./msw-server` and `./setup`
  subpaths. No React, DOM or `@tanstack/react-query` dependency.
- `@granit/react-testing` (this package) — adds the React Query + Testing Library
  helpers and re-exports the core, so React package tests need a single import.

There is no backend counterpart and no `react-ui` admin feature kit — this package
exists purely to remove boilerplate from `*.test.tsx` files across the monorepo.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. It is a dev-only dependency; declare
it (and its peers) under `devDependencies`. The peers a consumer must provide:

- `@granit/testing` — the core test utilities re-exported through this barrel.
- `@tanstack/react-query` (`^5`) — `QueryClient` / `QueryClientProvider`, wrapped by
  the query helpers.
- `react` (`^19`) — the wrapper components are React components.
- `vitest` (`^4`) — `vi.fn()` spies back the mock client and mock logger.
- `@testing-library/react` (`^16`, **optional**) — only needed by the consuming test
  for `renderHook` / `render`; this package does not import it directly.

The core peers of `@granit/testing` (`@granit/api-client`, `@granit/logger`, and the
optional `msw`) transitively apply when you use the re-exported mock helpers.

## Quick start

Build a deterministic `QueryClient` wrapper and a mocked Axios client, then drive a
hook under test — no real HTTP, no retries, no background GC.

```tsx
import {
  axiosResponse,
  createMockClient,
  createQueryWrapper,
} from '@granit/react-testing';
import { renderHook, waitFor } from '@testing-library/react';

const client = createMockClient();
const wrapper = createQueryWrapper(); // fresh QueryClient, retries off

vi.mocked(client.get).mockResolvedValue(axiosResponse({ id: '1', name: 'Acme' }));

const { result } = renderHook(() => useParty(client, '1'), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data).toEqual({ id: '1', name: 'Acme' });
```

When a hook needs a module provider on top of the `QueryClientProvider`, nest them
with `composeWrappers` (it applies wrappers outer-to-inner, left-to-right):

```tsx
import { composeWrappers, createQueryWrapper } from '@granit/react-testing';
import { MultiTenancyProvider } from '@granit/react-multi-tenancy';

const wrapper = composeWrappers(
  createQueryWrapper(),
  ({ children }) => <MultiTenancyProvider config={config}>{children}</MultiTenancyProvider>,
);

renderHook(() => useMyHook(), { wrapper });
```

## Public API

| Symbol                  | Kind | Purpose                                                                        |
| ----------------------- | ---- | ------------------------------------------------------------------------------ |
| `createTestQueryClient` | fn   | `QueryClient` with retries off and `gcTime: Infinity` for tests                |
| `createQueryWrapper`    | fn   | Wrapper component providing `QueryClientProvider` (custom client optional)     |
| `composeWrappers`       | fn   | Fold several `{ children }` wrappers into one (outer→inner)                    |
| `createMockClient`      | fn   | Fully `vi.fn()`-stubbed `AxiosInstance` (no real HTTP) — re-export             |
| `axiosResponse`         | fn   | Wrap data in a minimal `AxiosResponse<T>` for resolved-value stubs — re-export |
| `createMockLogger`      | fn   | `vi.fn()`-spied `Logger`; `child()` returns the same instance — re-export      |
| `MockLogger`            | type | Spy-typed `Logger` returned by `createMockLogger` — re-export                  |
| `Mutable<T>`            | type | Strip `readonly` from all properties (mutate readonly fixtures) — re-export    |

The bottom four rows (and `Mutable`) come straight from [`@granit/testing`](../testing)
via `export *`; this package adds the three React Query helpers at the top. For MSW
request mocking, import the `./msw`, `./msw-server` and `./setup` subpaths directly
from [`@granit/testing`](../testing) — they are not re-exported here.

## Caveats

- **Test-only.** Nothing here belongs in app runtime; import it from `devDependencies`
  and `*.test.ts(x)` files only. The arch-tests treat `vitest`/Testing Library imports
  as test scope.
- **Fresh client per wrapper.** `createQueryWrapper()` with no argument allocates a new
  `QueryClient`; share one across renders by passing it explicitly when a test asserts
  cross-render cache behavior.
- **`gcTime: Infinity` is deliberate.** Cached entries are never garbage-collected
  during a test run, keeping assertions stable; it is not a leak — each test gets its
  own client.
- **`createMockClient` is a structural stub**, cast through `unknown` to `AxiosInstance`.
  Only the call signatures are real; configure return values with `vi.mocked(...)`
  before exercising the hook.

## License

Apache-2.0
