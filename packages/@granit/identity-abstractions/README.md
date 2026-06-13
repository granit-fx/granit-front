# @granit/identity-abstractions

Identity abstractions for the Granit framework — the TypeScript mirror of
`Granit.Identity.Abstractions`.

A type-only package exposing the shared contracts consumed by every front-end
surface that displays sessions and devices:

- `UserSessionRiskLevel` — coarse risk classification for a session.
- `DeviceKind` — the kind of client a session or device represents, used to
  compose a localized device label.

Keeping these standalone — mirroring the backend `Granit.Identity.Abstractions`
assembly — lets infra and domain packages depend on the contracts without
coupling to each other, and prevents divergent per-package copies.

## Usage

```ts
import type { DeviceKind, UserSessionRiskLevel } from '@granit/identity-abstractions';
```
