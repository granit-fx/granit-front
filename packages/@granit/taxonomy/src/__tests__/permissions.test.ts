import { describe, expect, it } from 'vitest';

import { TaxonomyPermissions } from '../permissions';

describe('TaxonomyPermissions', () => {
  it('exposes the Tags Read/Manage keys matching the backend', () => {
    expect(TaxonomyPermissions.Tags.Read).toBe('Taxonomy.Tags.Read');
    expect(TaxonomyPermissions.Tags.Manage).toBe('Taxonomy.Tags.Manage');
  });

  it('exposes the Categories Read/Manage keys matching the backend', () => {
    expect(TaxonomyPermissions.Categories.Read).toBe('Taxonomy.Categories.Read');
    expect(TaxonomyPermissions.Categories.Manage).toBe('Taxonomy.Categories.Manage');
  });

  it('exposes the Search.Read key matching the backend', () => {
    expect(TaxonomyPermissions.Search.Read).toBe('Taxonomy.Search.Read');
  });
});
