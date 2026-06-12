# @granit/user-sessions

User-session risk contract for the Granit framework — the TypeScript mirror of
`Granit.UserSessions`.

A type-only package exposing the shared `UserSessionRiskLevel` classification
consumed by every front-end surface that displays session risk (BFF sessions,
identity sessions). Keeping it standalone — mirroring the backend
`Granit.UserSessions` module — prevents divergent per-package copies.

## Usage

```ts
import type { UserSessionRiskLevel } from '@granit/user-sessions';
```
