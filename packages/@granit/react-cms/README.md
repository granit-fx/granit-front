# @granit/react-cms

React block components and Puck visual editor integration for the Granit CMS.

## Overview

- **13 presentational block components** (`HeroBlock`, `CtaBlock`, …) that
  render the standard Granit CMS block types
- **`catalogToConfig(catalog, options?)`** — generates a `@puckeditor/core`
  `Config` from a `BlockCatalogResponse`, mapping each `BlockFieldKind` to its
  Puck field type; optionally wires `resolveData` for data-bound blocks
- **`resolveDocumentReferencesInData(data, catalog, resolveFn)`** — walks Puck
  `Data` + catalog schema, batch-resolves `DocumentReference` GUIDs and injects
  `_resolved_<fieldName>` siblings
- **`BLOCK_COMPONENTS`** — a ready-made `Record<string, ComponentType>` map
  from backend block name to React component
- **`CmsMenuNav`** — renders a `ResolvedMenu` as a navigation component

## Peer dependencies

- `react ^19`
- `@puckeditor/core ^0.21`
- `@granit/cms workspace:*`

## Usage

```tsx
import { catalogToConfig, resolveDocumentReferencesInData } from '@granit/react-cms';
import { resolveAllData, Render } from '@puckeditor/core';

const config = catalogToConfig(catalog, { resolveBlockData, siteId, culture });
const resolvedData = await resolveAllData(pageData, config);
const dataWithDocs = await resolveDocumentReferencesInData(resolvedData, catalog, resolveDocuments);

return <Render config={config} data={dataWithDocs} />;
```
