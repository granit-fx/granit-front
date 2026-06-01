import { FormLayoutEditor, type FormLayoutEditorProps } from './form-layout-editor';

import type { ReactNode } from 'react';

/**
 * Workspace tiles are described with the same shape as form fields
 * (`name` + optional `defaultGroup`/`label`), and the same three deltas
 * apply (`Reorder`, `Regroup`, `Hide`). We expose a dedicated component
 * name so consumers can reason about workspace vs. form customization
 * separately, but the implementation is shared with `<FormLayoutEditor>`.
 */
export type WorkspaceLayoutEditorProps = FormLayoutEditorProps;

export function WorkspaceLayoutEditor(props: WorkspaceLayoutEditorProps): ReactNode {
  return <FormLayoutEditor {...props} />;
}
