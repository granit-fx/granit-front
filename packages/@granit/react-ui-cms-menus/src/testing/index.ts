// Test fixtures + MSW handler factory for CMS menus, re-exported from the headless
// @granit/react-cms/testing surface. The handler factory is base-path-agnostic;
// the host passes the absolute menus endpoint (showcase resolved `@/mocks/api-url`).
export { createMenusHandlers, mockMenus } from '@granit/react-cms/testing';
