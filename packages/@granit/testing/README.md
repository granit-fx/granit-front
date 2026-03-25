# @granit/testing

Shared test utilities for `@granit/*` packages -- mock Axios client, mock logger, response helpers.

## Installation

```bash
pnpm add -D @granit/testing
```

## API

### Functions

- `createMockClient()` -- create a mocked Axios instance with all methods stubbed (vitest)
- `axiosResponse(data, status?)` -- build an `AxiosResponse` object for test assertions
- `createMockLogger()` -- create a mock logger matching `@granit/logger` interface

### Types

- `MockLogger` -- mock logger type with vitest spy methods

## Usage

```ts
import { createMockClient, axiosResponse } from '@granit/testing';

const client = createMockClient();
client.get.mockResolvedValueOnce(axiosResponse({ id: '1', name: 'test' }));

const result = await fetchItem(client, '/api', '1');
expect(result.name).toBe('test');
```

## License

Apache-2.0
