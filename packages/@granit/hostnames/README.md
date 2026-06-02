<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/hostnames

Framework-agnostic core package for the **Granit Hostnames** module: DTOs, Axios
API calls, and permission constants.

Mirrors the `Granit.Hostnames` .NET domain. Consumed by
[`@granit/react-hostnames`](../react-hostnames/README.md).

Part of the [Granit](https://granit-fx.dev) framework.

## Exports

### Types

| Type                           | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `ManagedHostnameResponse`      | Full hostname descriptor (id, host, status, DNS, TLS, …) |
| `ManagedHostnameStatus`        | `Pending \| Verifying \| Active \| Error`                |
| `CertificateStatus`            | `Unprovisioned \| Provisioning \| Secured \| Error`      |
| `CreateManagedHostnameRequest` | Request body for hostname creation                       |
| `UpdateManagedHostnameRequest` | Request body to toggle `isPrimary`                       |
| `ListHostnamesParams`          | Query params for the paginated list endpoint             |
| `CheckAvailabilityResponse`    | `{ isAvailable: boolean }`                               |
| `ExpectedDnsRecord`            | DNS record required for domain ownership verification    |
| `HostnameConflict`             | Conflict preventing a hostname from becoming active      |
| `PagedResponse<T>`             | Generic 0-based pagination envelope                      |

### API functions

All functions take an `AxiosInstance` (from `@granit/api-client`) and a
`basePath` string. The default base path is `/api/hostnames`.

| Function                  | HTTP call                                 |
| ------------------------- | ----------------------------------------- |
| `listHostnames`           | `GET {basePath}`                          |
| `getHostname`             | `GET {basePath}/{id}`                     |
| `createHostname`          | `POST {basePath}`                         |
| `updateHostname`          | `PATCH {basePath}/{id}`                   |
| `deleteHostname`          | `DELETE {basePath}/{id}`                  |
| `checkAvailability`       | `GET {basePath}/check-availability?host=` |
| `verifyNow`               | `POST {basePath}/{id}/verify-now`         |
| `reportCertificateStatus` | `POST {basePath}/{id}/certificate-status` |

### Permissions

```ts
import { HostnamesPermissions } from '@granit/hostnames';

// Hostnames.Hostnames.Read
// Hostnames.Hostnames.Manage
// Hostnames.Certificates.Report
```

## Usage

This package is consumed indirectly through `@granit/react-hostnames`. Direct
use is only needed for headless scenarios (server-side or non-React clients).

```ts
import { listHostnames, ManagedHostnameStatus } from '@granit/hostnames';
import type { ListHostnamesParams } from '@granit/hostnames';

const params: ListHostnamesParams = { page: 0, pageSize: 20, status: ManagedHostnameStatus.Active };
const { items, totalCount } = await listHostnames(axiosClient, '/api/hostnames', params);
```
