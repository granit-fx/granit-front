# @granit/react-features

React bindings for `@granit/features` -- feature flags, values, overrides, and admin management.

## Installation

```bash
pnpm add @granit/react-features
```

## API

### Components

- `FeaturesProvider` -- provides feature configuration to the component tree

### Hooks

- `useFeaturesConfig()` -- access features configuration from context
- `useFeatureDefinitions()` -- list feature definitions
- `useFeatureValues()` -- fetch all feature values
- `useFeatureFlag(name)` -- check if a feature flag is enabled
- `useFeatureValue(name)` -- get a specific feature value
- `useSetFeatureOverride()` -- set a feature override
- `useDeleteFeatureOverride()` -- remove a feature override
- `useAdminFeatureFlags()` -- list admin feature flags
- `useToggleAdminFeatureFlag()` -- toggle an admin feature flag

## Usage

```tsx
import { FeaturesProvider, useFeatureFlag } from '@granit/react-features';

function App() {
  return (
    <FeaturesProvider client={axiosInstance} basePath="/api/features">
      <Dashboard />
    </FeaturesProvider>
  );
}

function Dashboard() {
  const { enabled } = useFeatureFlag('dark-mode');

  return <div className={enabled ? 'dark' : 'light'}>Dashboard</div>;
}
```

## License

Apache-2.0
