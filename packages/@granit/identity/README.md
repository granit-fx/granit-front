# @granit/identity

Identity provider capabilities -- types and API for `GET /identity/users/capabilities`.

## Installation

```bash
pnpm add @granit/identity
```

## API

### Types

- `IdentityProviderCapabilities` -- describes what the identity provider supports (password reset, registration, etc.)

### Functions

- `getIdentityCapabilities(axios)` -- fetches identity provider capabilities from the server

## Usage

```ts
import { getIdentityCapabilities } from '@granit/identity';
import type { IdentityProviderCapabilities } from '@granit/identity';

const capabilities = await getIdentityCapabilities(axiosInstance);
```

## License

Apache-2.0
