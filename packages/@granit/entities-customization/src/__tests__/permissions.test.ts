import { describe, expect, it } from 'vitest';

import { CustomizationPermissions } from '../permissions.js';

describe('CustomizationPermissions', () => {
  it('exposes the four canonical keys in the EntitiesCustomization namespace', () => {
    expect(CustomizationPermissions.EntitiesCustomization.Forms.Read).toBe(
      'EntitiesCustomization.Forms.Read'
    );
    expect(CustomizationPermissions.EntitiesCustomization.Forms.Manage).toBe(
      'EntitiesCustomization.Forms.Manage'
    );
    expect(CustomizationPermissions.EntitiesCustomization.Workspaces.Read).toBe(
      'EntitiesCustomization.Workspaces.Read'
    );
    expect(CustomizationPermissions.EntitiesCustomization.Workspaces.Manage).toBe(
      'EntitiesCustomization.Workspaces.Manage'
    );
  });
});
