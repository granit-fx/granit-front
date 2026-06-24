# @granit/testing

Shared, framework-agnostic **test utilities** for `@granit/*` packages — a mocked
Axios client, a mock `@granit/logger`, an MSW server factory with the Vitest
lifecycle pre-wired, and a library of query-engine-aware MSW response/filter
helpers. This is the **tooling** layer: it carries no domain logic and no
backend counterpart; it exists so every package's tests share one set of mocks
and one serialization-aware fake server instead of re-rolling them.

It holds no React or DOM dependency at its root. The React-specific harness
(`QueryClient` factory, render wrappers) lives one layer up in
[`@granit/react-testing`](../react-testing), which depends on this package. The
Node-only MSW server factory is isolated behind the `/msw-server` subpath so the
browser-safe response helpers (`/msw`) stay importable in any environment.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. (It also
ships a `tsup` build and is publishable to `npm.pkg.github.com`, but in-repo
consumption goes through the source alias.) A consumer's test setup must provide
these peers:

- `vitest` (`^4`) — `createMockClient` / `createMockLogger` return `vi.fn()`
  spies, and `createMwhServer` registers `beforeAll`/`afterEach`/`afterAll`
  hooks.
- `@granit/api-client` — supplies the `AxiosInstance` shape that
  `createMockClient` / `axiosResponse` mock.
- `@granit/logger` (**optional**) — the `Logger` interface `createMockLogger`
  structurally satisfies; only needed by tests asserting on logging.
- `msw` (`^2.12`, **optional**) — required only for the `/msw` and `/msw-server`
  subpaths.

The `./setup` subpath additionally relies on `@testing-library/jest-dom` and a
`jsdom` test environment being available to the consuming package.

## Quick start

Root import — mock the Axios client and assert without real HTTP:

```ts
import { createMockClient, axiosResponse } from '@granit/testing';

const client = createMockClient();
client.get.mockResolvedValueOnce(axiosResponse({ id: '1', name: 'test' }));

const result = await fetchItem(client, '/api/v1/items', '1');
expect(result.name).toBe('test');
expect(client.get).toHaveBeenCalledWith('/api/v1/items/1');
```

`/msw-server` + `/msw` — stand up a fake backend whose handlers honor the
query-engine filter/sort/page convention. `createMswServer` wires the Vitest
lifecycle (listen / reset / close) for you:

```ts
import { http } from 'msw';
import { createMswServer } from '@granit/testing/msw-server';
import { parseFilters, parseSort, sortItems, paginate, pagedResponse } from '@granit/testing/msw';

const items = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

// onUnhandledRequest defaults to 'error' — a missing handler fails the test.
const server = createMswServer(
  http.get('/api/v1/items', ({ request }) => {
    const url = new URL(request.url);
    const filtered = items.filter((it) =>
      parseFilters(url).every((f) => applyFilter(it, f))
    );
    const sorted = sortItems(filtered, parseSort(url), 'name');
    const { items: page, totalCount } = paginate(sorted, url);
    return pagedResponse(page, totalCount);
  })
);

// `server` is a standard msw `setupServer` result — add per-test handlers with
// server.use(...); they reset automatically after each test.
```

`./setup` — reference it from `setupFiles` in a package's `vitest.config` to
install the `@testing-library/jest-dom` matchers and the jsdom polyfills
(`matchMedia`, `ResizeObserver`, `IntersectionObserver`, pointer-capture,
`scrollIntoView`) that Radix / cmdk component tests need. The file is a no-op
outside jsdom, so node-only hook suites can share the same setup entry.

## Public API

Root (`@granit/testing`):

| Symbol             | Kind | Purpose                                                          |
| ------------------ | ---- | ---------------------------------------------------------------- |
| `createMockClient` | fn   | Fully `vi.fn()`-stubbed `AxiosInstance` (no real HTTP)           |
| `axiosResponse`    | fn   | Wrap data in a minimal `AxiosResponse<T>` (status 200)           |
| `createMockLogger` | fn   | `vi.fn()`-spied `Logger`; `child()` returns the same instance    |
| `MockLogger`       | type | `Logger` with `Mock`-typed methods for spy assertions            |
| `Mutable<T>`       | type | Strip `readonly` so frozen mock fixtures can be mutated in tests |

`@granit/testing/msw-server` (Node-only):

| Symbol             | Kind | Purpose                                                |
| ------------------ | ---- | ------------------------------------------------------ |
| `createMswServer`  | fn   | `setupServer` + Vitest listen/reset/close lifecycle    |
| `MswServerOptions` | type | `{ onUnhandledRequest }` — defaults to `'error'`       |

`@granit/testing/msw` (browser-safe), grouped by role:

| Symbol                                                        | Kind | Purpose                                                   |
| ------------------------------------------------------------- | ---- | --------------------------------------------------------- |
| `pagedResponse` / `created`                                   | fn   | JSON bodies: `PagedResult<T>` (200) / `T` (201)           |
| `noContent` / `accepted` / `notFound`                         | fn   | Bodyless `204` / `202` / `404` responses                  |
| `unprocessableEntity`                                         | fn   | `422` with a `ProblemDetails` body                        |
| `parseFilters` / `parseSort`                                  | fn   | Parse `filter[field.Op]=` / `sort=` search params         |
| `applyStringFilter` / `applyNumberFilter` / `applyDateFilter` | fn   | Typed operator predicates (`Eq`, `Gt`, `In`, …)           |
| `applyFilter`                                                 | fn   | Dispatch a `FilterEntry` by runtime value type            |
| `sortItems` / `paginate` / `groupBy`                          | fn   | Sort, page (1-based), and group in-memory records         |
| `FilterEntry` / `SortEntry`                                   | type | Parsed `{ field, operator, value }` / `{ field, desc }`   |

`@granit/testing/setup` has no exports — it is a side-effecting `setupFiles`
entry.

## Out of scope / caveats

- **React harness.** `QueryClient` factories and render wrappers are
  [`@granit/react-testing`](../react-testing), not this package. Keep the root
  free of React/DOM imports so it stays usable from node-only suites.
- **`vitest` is mandatory at runtime, not just a dev tool.** `createMockClient`,
  `createMockLogger`, and `createMswServer` call `vi.*` / register lifecycle
  hooks at module load — import them only inside a Vitest test run.
- **`/msw-server` is Node-only.** It imports `msw/node`; importing it in a
  browser/jsdom bundle will fail. Browser-safe response and filter helpers live
  at `/msw`.
- **`axiosResponse` returns a fixed `status: 200`.** It takes no status
  argument; for other statuses build the `AxiosResponse` literal yourself or use
  the MSW error helpers (`notFound`, `unprocessableEntity`, …).
- **Filter helpers mirror, do not import, `@granit/query-engine`.** The
  `PagedResult` / `GroupedResult` shapes and the `filter[field.Op]=` /
  `sort=-field` conventions are duplicated locally to avoid a circular workspace
  dependency; keep them in sync with the real serializer when it changes.
- **`onUnhandledRequest` defaults to `'error'`.** A request with no matching
  handler fails the test loudly — intentional, to surface missing mocks. Pass
  `createMswServer({ onUnhandledRequest: 'bypass' })` only when you deliberately
  hit a real endpoint.

## License

Apache-2.0
