# @granit/react-ui-entities

Manifest-driven entity-rendering UI for Granit admin apps — the UI counterpart
to the headless [`@granit/react-entities`](../react-entities).

Generic list / detail / form rendering plus calendar, kanban and gallery
layouts, entity action overlays (drawer/modal) and collection sections, driven
entirely by the backend entity manifest (no per-entity code).

## App-agnostic seams

- **`renderImage`** — gallery card images are injected (e.g. `<BlobImage>` from
  `@granit/react-blob-storage`) so the package stays storage-agnostic.
- **`activeWorkspaceName`** — the side-peek drawer receives the active workspace
  from the host's workspace context.
- Label resolution uses `resolveLabel` from `@granit/react-localization`.
