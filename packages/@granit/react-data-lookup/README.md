# @granit/react-data-lookup

React hooks and headless components for **@granit/data-lookup**.

## Hooks

- `useLookup(descriptor, params, options)` — debounced search with automatic
  **Empty Scope Trap** guard: when a declared `scopeKeys` value is missing,
  `enabled` flips to `false` and `missingScopeKey` is surfaced so the UI can
  render an informative placeholder.
- `useLookupResolve(descriptor, value, options)` — rehydrates a previously
  persisted value into a localized label (for edit forms and detail views).

## Components

All components follow the **headless render-prop** pattern so consumers keep
full control of their UI kit.

- `<LookupSelect>` — combobox-style single-select. Usage: forms.
- `<LookupPicker>` — SmartFilterBar-ready variant; supports multi-select for
  the `In` filter operator.
- `<LookupBadge>` — read-only projection of a value (detail pages, audit logs).

## Usage

```tsx
import { LookupSelect } from '@granit/react-data-lookup';

<LookupSelect
  descriptor={{ name: 'tenants', scopeKeys: [] }}
  value={tenantId}
  onChange={setTenantId}
  client={axios}
  culture={i18n.resolvedLanguage}
  render={({ items, search, setSearch, selectedItem, onChange, missingScopeKey }) =>
    missingScopeKey ? (
      <span>Select a {missingScopeKey} first.</span>
    ) : (
      <Combobox>
        <Combobox.Input value={search} onChange={(e) => setSearch(e.target.value)} />
        <Combobox.Options>
          {items.map((item) => (
            <Combobox.Option key={String(item.value)} value={item.value}>
              {item.label}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    )
  }
/>;
```

See the backend documentation at `/dotnet/business/data-lookup/` for the
contract and ADR-023 for the architectural rationale.
