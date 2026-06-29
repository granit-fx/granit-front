/**
 * Scoped, self-contained styles for the react-grid-layout editor surface.
 *
 * We deliberately do NOT `import 'react-grid-layout/css/styles.css'`: a CSS
 * side-effect import in a workspace-source package breaks consumers' `tsc -r`
 * (the ambient `*.css` module isn't visible across the package boundary). So
 * the essential rules — item transitions, drag/resize/placeholder states, and
 * the eight resize-handle positions — are inlined here, scoped under
 * `[data-slot="editable-dashboard"]`, and themed with Granit design tokens.
 *
 * Rendered once per `<EditableDashboard>`; duplicate identical rules across
 * multiple dashboards on a page are harmless.
 */
const GRID_CSS = `
[data-slot="editable-dashboard"] .react-grid-layout { position: relative; transition: height 200ms ease; }
[data-slot="editable-dashboard"] .react-grid-item { box-sizing: border-box; transition: all 200ms ease; transition-property: left, top, width, height; }
[data-slot="editable-dashboard"] .react-grid-item.cssTransforms { transition-property: transform, width, height; }
[data-slot="editable-dashboard"] .react-grid-item.resizing { z-index: 3; will-change: width, height; opacity: 0.9; }
[data-slot="editable-dashboard"] .react-grid-item.react-draggable-dragging { transition: none; z-index: 4; will-change: transform; cursor: grabbing; }
[data-slot="editable-dashboard"] .react-grid-item.react-grid-placeholder {
  background: var(--color-primary, #6366f1);
  opacity: 0.14;
  border-radius: 0.75rem;
  transition-duration: 100ms;
  z-index: 2;
  user-select: none;
}
[data-slot="editable-dashboard"] .react-resizable-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  opacity: 0;
  transition: opacity 120ms ease;
  z-index: 5;
  touch-action: none;
}
[data-slot="editable-dashboard"] .react-grid-item:hover .react-resizable-handle,
[data-slot="editable-dashboard"] .react-grid-item.resizing .react-resizable-handle { opacity: 1; }
[data-slot="editable-dashboard"] .react-resizable-handle::after {
  content: "";
  position: absolute;
  inset: 50% auto auto 50%;
  width: 7px;
  height: 7px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px var(--color-card, #fff);
}
[data-slot="editable-dashboard"] .react-resizable-handle-se { bottom: 0; right: 0; cursor: se-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-sw { bottom: 0; left: 0; cursor: sw-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-ne { top: 0; right: 0; cursor: ne-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-nw { top: 0; left: 0; cursor: nw-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-n { top: 0; left: 50%; margin-left: -8px; cursor: n-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-s { bottom: 0; left: 50%; margin-left: -8px; cursor: s-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-e { right: 0; top: 50%; margin-top: -8px; cursor: e-resize; }
[data-slot="editable-dashboard"] .react-resizable-handle-w { left: 0; top: 50%; margin-top: -8px; cursor: w-resize; }
`;

export function GridStyles() {
  return <style data-slot="editable-dashboard-styles">{GRID_CSS}</style>;
}
