# @granit/react-storage

React bindings for `@granit/storage` -- hooks for synchronized browser storage.

## Installation

```bash
pnpm add @granit/react-storage
```

## API

### Hooks

- `useStorage<T>(key, defaultValue, options?)` — read and write to browser storage (localStorage/sessionStorage) with cross-tab synchronization

## Usage

```tsx
import { useStorage } from '@granit/react-storage';

function ThemeSelector() {
  const [theme, setTheme] = useStorage('app.theme', 'light');

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

## License

Apache-2.0
