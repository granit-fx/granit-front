# @granit/identity-abstractions

Identity abstractions for the Granit framework — the TypeScript mirror of
`Granit.Identity.Abstractions`.

A type-only package exposing the shared `UserSessionRiskLevel` classification
consumed by every front-end surface that displays session risk (BFF sessions,
identity sessions). Keeping it standalone — mirroring the backend
`Granit.Identity.Abstractions` assembly — lets both `@granit/bff` (infra) and
`@granit/identity` (domain) depend on the contract without coupling to each
other, and prevents divergent per-package copies.

## Usage

```ts
import type { UserSessionRiskLevel } from '@granit/identity-abstractions';
```
