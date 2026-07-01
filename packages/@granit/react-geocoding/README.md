# @granit/react-geocoding

Headless React bindings for [`@granit/geocoding`](../geocoding) — a provider and
React Query hooks. The styled components (`AddressAutocompleteInput`,
`AddressPrecisionBadge`) and the `geocoding` i18n bundles live one layer up in
[`@granit/react-ui-geocoding`](../react-ui-geocoding), which keeps this package
free of any `@granit/react-ui` dependency.

## What's inside

- **`GeocodingProvider`** — supplies the Axios `client` + `basePath` (defaults to
  `/api/v1/geocoding`) to the hooks. Built on the shared `createConfigProvider`
  factory; `useGeocodingConfig` / `useOptionalGeocodingConfig` read it.
- **`useAddressSuggestions(search, options)`** — debounced typeahead hook.
  Returns ranked `suggestions` plus `isLoading` / `isError` / `isUnavailable`.
- **`useReverseGeocode(coordinate, options)`** — headless reverse-geocoding for a
  map pin-drop. Returns the nearest `address` (or `null` for a soft 404/422 miss).

## Progressive enhancement

Geocoding is **never a hard dependency**. When no `GeocodingProvider` is in
scope, or the endpoint is not mapped (provider not installed → 404), the hooks
report `isUnavailable` — so a form keeps working with manual entry. Input is
debounced (~275 ms) before it reaches the shared, rate-limited provider, and
in-flight requests are cancelled when the text changes.

## Quick start

```tsx
import { GeocodingProvider, useAddressSuggestions } from '@granit/react-geocoding';

function AddressField() {
  const [text, setText] = useState('');
  const { suggestions, isLoading } = useAddressSuggestions(text, { enabled: true });
  // Render your own input from `suggestions`, or use
  // <AddressAutocompleteInput> from @granit/react-ui-geocoding.
  return null;
}

// Mount once, high in the tree (client comes from <GranitClientProvider>):
<GeocodingProvider config={{}}>
  <AddressField />
</GeocodingProvider>;
```

### Reverse pin-drop

`@granit/react-map` is presentation-only (no interactive click callback), so the
reverse flow is intentionally headless — wire `useReverseGeocode` to whichever
map your app uses:

```tsx
const { address } = useReverseGeocode(pin); // pin: { lat, lon } | null
useEffect(() => {
  if (address) prefillForm(address);
}, [address]);
```

## i18n

The hooks in this package emit no user-facing copy. The `geocoding` i18n bundles
(`geocodingTranslationsEn` / `geocodingTranslationsFr`) ship with the styled
components in [`@granit/react-ui-geocoding`](../react-ui-geocoding).

## Testing

`@granit/react-geocoding/testing` ships MSW handlers and fixtures:

```ts
import {
  createGeocodingHandlers,
  createUnavailableGeocodingHandlers,
} from '@granit/react-geocoding/testing';
```
