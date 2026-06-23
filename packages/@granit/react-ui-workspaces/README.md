# @granit/react-ui-workspaces

Workspace UI for Granit admin apps — the workspace landing page that pairs with
the headless [`@granit/react-workspaces`](../react-workspaces) (the workspace
tree hooks and route helpers).

The headless package owns the _data_ (`useWorkspaces`, landing routes); this
package owns the _pages_.

## Components

- **`WorkspacePage`** — the "you are here" landing reached from the launcher or
  the workspace switcher. It looks the workspace up in the tree and shows its
  icon, title and a short subtitle.

The page is app-agnostic:

- pass the route's `workspaceName` (the host reads it from `useParams`), so the
  page stays router-free;
- pass a `renderIcon` slot — the showcase injects shell-admin's `WorkspaceIcon`,
  so the package carries no icon-rendering dependency;
- the `Workspace.*` strings ship in `workspacesTranslationsEn` /
  `workspacesTranslationsFr`; register them in your i18n instance.

## Usage

```tsx
import { WorkspaceIcon } from '@granit/react-ui-shell-admin';
import { WorkspacePage } from '@granit/react-ui-workspaces';
import { useParams } from 'react-router-dom';

function WorkspacePageRoute() {
  const { workspace } = useParams<{ workspace: string }>();
  return (
    <WorkspacePage
      workspaceName={workspace}
      renderIcon={(name, className) => <WorkspaceIcon name={name} className={className} />}
    />
  );
}
```
