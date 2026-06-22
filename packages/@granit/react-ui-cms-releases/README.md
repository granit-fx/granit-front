# @granit/react-ui-cms-releases

Admin UI for the **CMS Releases** module — the releases list (status badges,
schedule, publish action), the release detail page (scheduling / rescheduling /
cancelling, per-action status) and the create-release dialog.

The **visual** layer for releases: it composes the headless
[`@granit/react-cms`](../react-cms) (provider + release hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)). Form validation is
spec-driven via [`@granit/react-validation`](../react-validation) against the
[`@granit/cms`](../cms) constraints, and the timezone field reuses the
`TimezonePicker` from [`@granit/react-ui-admin-kit`](../react-ui-admin-kit).

## Usage

```tsx
import {
  ReleasesListPage,
  ReleaseDetailPage,
  cmsReleasesTranslationsEn,
} from '@granit/react-ui-cms-releases';

i18n.addResourceBundle('en', 'translation', cmsReleasesTranslationsEn, true, true);

// Mount under a CmsProvider (from @granit/react-cms):
<Route path="/cms/sites/:id/releases" element={<ReleasesListPage />} />
<Route path="/cms/sites/:id/releases/:releaseId" element={<ReleaseDetailPage />} />;
```

## Injection

- **API client** — resolved from a `CmsProvider` / `GranitClientProvider` higher
  in the tree (via the `@granit/react-cms` hooks). No client baked in.
- **Validation** — `createConstraintsResolver` from `@granit/react-validation`
  drives both forms from the `@granit/cms` `CreateReleaseRequest` /
  `ScheduleReleaseRequest` constraints.
- **i18n** — ships its `cms:Releases.*` strings
  (`cmsReleasesTranslationsEn/Fr`); the host registers them. Keys keep the
  literal `cms:` prefix (flat keys, `translation` namespace).
