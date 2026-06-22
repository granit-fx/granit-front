# @granit/react-ui-features

Admin UI for the **Features** module — the feature-flag listing (definitions
grouped into collapsible cards), value badges, a per-feature detail page and the
set / remove-override dialog.

The **visual** layer for feature flags: it composes the headless
[`@granit/react-features`](../react-features) (data hooks + provider) with the
foundation UI package ([`@granit/react-ui`](../react-ui)).

## Usage

```tsx
import {
  FeatureListPage,
  FeatureDetailPage,
  featuresTranslationsEn,
} from '@granit/react-ui-features';

i18n.addResourceBundle('en', 'translation', featuresTranslationsEn, true, true);

<Route path="/features" element={<FeatureListPage />} />;
<Route path="/features/:name" element={<FeatureDetailPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree (`useGranitClient`), then handed
  to the headless `FeaturesProvider`. No client is baked in.
- **i18n** — ships its `Features.*` strings (`featuresTranslationsEn/Fr`); the host
  registers them. `Common.*` keys (e.g. `Common.Cancel`) are app-global.
- **Toasts** — override mutations report via `sonner`; mount a `<Toaster />` in the
  host.
