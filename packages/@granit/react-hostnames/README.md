<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/react-hostnames

React hooks and provider for the **Granit Hostnames** module — lets applications
manage custom domains (DNS verification, TLS provisioning, primary flag).

Depends on [`@granit/hostnames`](../hostnames/README.md) for the core API.

Part of the [Granit](https://granit-fx.dev) framework.

## Setup

Wrap the relevant part of your tree with `HostnamesProvider`. The provider
reads the Axios client from the nearest `<GranitClientProvider>` by default.

```tsx
import { HostnamesProvider } from '@granit/react-hostnames';

<HostnamesProvider config={{ basePath: '/api/hostnames' }}>
  <MyApp />
</HostnamesProvider>;
```

Pass `config.client` explicitly if the module uses a different Axios instance:

```tsx
<HostnamesProvider config={{ client: myClient, basePath: '/api/hostnames' }}>
  <MyApp />
</HostnamesProvider>
```

## Hooks

### Query hooks

```tsx
import { useHostnames, useHostname, useCheckAvailability } from '@granit/react-hostnames';

// Paginated list
const { data } = useHostnames({ page: 0, pageSize: 20, ownerType: 'cms.site' });

// Single hostname
const { data: hostname } = useHostname('hostname-id');

// Availability check
const { data } = useCheckAvailability('app.example.com');
```

### Mutation hooks

```tsx
import {
  useCreateHostname,
  useUpdateHostname,
  useDeleteHostname,
  useVerifyNow,
} from '@granit/react-hostnames';

const { mutateAsync: create } = useCreateHostname();
await create({ host: 'app.example.com', ownerType: 'cms.site', ownerId: 'site-1' });

const { mutate: setPrimary } = useUpdateHostname();
setPrimary({ id: 'hostname-id', request: { isPrimary: true } });

const { mutate: remove } = useDeleteHostname();
remove('hostname-id');

const { mutate: recheck } = useVerifyNow();
recheck('hostname-id'); // triggers immediate DNS re-verification
```

All mutation hooks invalidate the relevant queries on success.

## Query keys

```ts
import { hostnamesKeys } from '@granit/react-hostnames';

hostnamesKeys.all(); // root key for all hostnames queries
hostnamesKeys.lists(); // all list queries
hostnamesKeys.list(params); // list with specific params
hostnamesKeys.hostname(id); // single hostname detail
```

## Testing

```ts
import { hostnameHandlers, mockHostname } from '@granit/react-hostnames/testing';
```

MSW handlers covering all endpoints are available from the `/testing` subpath.
