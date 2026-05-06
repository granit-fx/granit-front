# @granit/react-activities

React bindings for `@granit/activities` — provider, hooks, and headless components for the cross-entity to-do module (`Granit.Activities`).

## What's in the box

- **Provider + read hooks** — `<ActivitiesProvider>`, `useActivities`, `useActivity`, `useActivitiesCalendar`
- **Mutation hooks** — `useCreateActivity`, `useCompleteActivity`, `useCancelActivity`, `useReassignActivity`, `useRescheduleActivity` (with cache invalidation strategy isolated to `list` / `calendar` / `detail(id)` segments)
- **Components** — `<ActivityList>`, `<ActivityDetailPanel>`, `<ActivityCalendar>`, `<ActivitiesSidePanel>` (all headless: minimal HTML + `data-granit-activity-*` markers)
- **EntityDetail contribution** — `activitiesSidePanel({ … })` factory for `EntityComponentCatalog.sidePanels.Activities`
- **Notifications integration** — `ActivityNotificationTypes`, type guards, `resolveActivityNotificationAction()` for click-through routing
- **i18n bundles** — `activitiesTranslationsEn` / `activitiesTranslationsFr` (namespace: `'activities'`)

## i18n

Components ship English defaults baked in and accept `labels` / `actionLabels` props for overrides — apps wire `t()` results from the catalogs:

```tsx
import {
  ActivityList,
  activitiesTranslationsEn,
  activitiesTranslationsFr,
} from '@granit/react-activities';
import { useTranslation } from 'react-i18next';

// At app boot
i18n.addResourceBundle('en', 'activities', activitiesTranslationsEn);
i18n.addResourceBundle('fr', 'activities', activitiesTranslationsFr);

// In a component
const { t } = useTranslation('activities');

<ActivityList
  actionLabels={{
    complete: t('Action.Complete'),
    cancel: t('Action.Cancel'),
    reassign: t('Action.Reassign'),
    reschedule: t('Action.Reschedule'),
  }}
  onComplete={…}
/>
```

This split (catalogs shipped, components headless) keeps the components testable without an i18n bootstrap and lets apps own when/how i18n mounts.

## Permission gating

Each action callback is optional. Omit a callback to hide the matching button — apps gate rendering by their own permission system. The server still enforces (`Activities.Activities.{Read,Manage,Execute}`).

## Conventions

- All HTTP calls route through `@granit/api-client`'s Axios instance (CSRF / auth / tenant headers inherited).
- Verb naming mirrors the .NET backend: `get*` / `list*` (never `fetch*`).
- Cache-key namespacing: `['activities', 'list' | 'detail' | 'calendar', …]` so mutations only invalidate the layers they affect.
- Drag-to-reschedule on the calendar is intentionally out of scope — apps wire pointer/drag against `useRescheduleActivity`.
