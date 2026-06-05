<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/hostnames

Framework-agnostic core package for the **Granit Hostnames** module: DTOs, Axios
API calls, and permission constants.

Mirrors the `Granit.Hostnames` .NET domain. Consumed by
[`@granit/react-hostnames`](../react-hostnames/README.md).

Part of the [Granit](https://granit-fx.dev) framework.

## Exports

### Types

| Type                             | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `ManagedHostnameResponse`        | Full hostname descriptor (id, host, status, DNS, TLS, …)  |
| `HostnameStatus`                 | `Pending \| Verifying \| Active \| Error`                 |
| `CertificateStatus`              | `Unprovisioned \| Provisioning \| Secured \| Error`       |
| `DnsRecordType`                  | `A \| Aaaa \| Cname \| Txt`                               |
| `DnsConflictType`                | DNS conflict category (`MissingTxt`, `DivergentCname`, …) |
| `ExpectedDnsRecord`              | DNS record required for domain ownership verification     |
| `DnsConflict`                    | Conflict preventing a hostname from becoming active       |
| `CreateManagedHostnameRequest`   | Request body for hostname creation                        |
| `ReportCertificateStatusRequest` | Request body for the certificate-status webhook           |
| `HostnameAvailabilityResponse`   | `{ host, isAvailable }`                                   |
| `ListHostnamesParams`            | Query params (`ownerType`, `ownerId`, `maxResults`)       |

### API functions

All functions take an `AxiosInstance` (from `@granit/api-client`) and a
`basePath` string. The default base path is `/api/hostnames`.

| Function                  | HTTP call                                 |
| ------------------------- | ----------------------------------------- |
| `listHostnames`           | `GET {basePath}`                          |
| `getHostname`             | `GET {basePath}/{id}`                     |
| `createHostname`          | `POST {basePath}`                         |
| `setPrimary`              | `POST {basePath}/{id}/primary`            |
| `clearPrimary`            | `DELETE {basePath}/{id}/primary`          |
| `deleteHostname`          | `DELETE {basePath}/{id}`                  |
| `checkAvailability`       | `GET {basePath}/availability?host=`       |
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
import { listHostnames, HostnameStatus } from '@granit/hostnames';
import type { ListHostnamesParams } from '@granit/hostnames';

const params: ListHostnamesParams = { ownerType: 'cms.site', ownerId: 'owner-1' };
const hostnames = await listHostnames(axiosClient, '/api/hostnames', params);
const active = hostnames.filter((h) => h.status === HostnameStatus.Active);
```
