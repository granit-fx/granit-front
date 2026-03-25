# @granit/features

Feature management types and API -- definitions, values, overrides, admin flags. Mirrors `Granit.Features` .NET contract.

## Installation

```bash
pnpm add @granit/features
```

## API

### Types

- `FeatureDefinition`, `FeatureGroup` -- feature definitions
- `FeatureValueResponse`, `FeatureValuesMap`, `FeatureValueType` -- feature values
- `FeatureNumericConstraint`, `SelectionValues` -- value constraints
- `SetFeatureOverrideRequest` -- override management
- `AdminFeatureFlag` -- admin flag management

### Constants

- `FEATURE_VALUE_TYPES` -- available feature value types

### Functions

- `fetchFeatureDefinitions(...)` -- list feature definitions
- `fetchFeatureValues(...)`, `fetchFeatureValue(...)` -- read feature values
- `setFeatureOverride(...)`, `deleteFeatureOverride(...)` -- manage overrides
- `fetchAdminFeatureFlags(...)`, `toggleAdminFeatureFlag(...)` -- admin operations

## Usage

```ts
import { fetchFeatureValues, setFeatureOverride } from '@granit/features';

const values = await fetchFeatureValues(client, basePath);
await setFeatureOverride(client, basePath, { name: 'dark-mode', value: 'true' });
```

## License

Apache-2.0
