import { describe, expect, it } from 'vitest';

import { ActivitiesPermissions } from '../permissions';

describe('ActivitiesPermissions', () => {
  it('exposes the three Activities permissions matching the backend keys', () => {
    expect(ActivitiesPermissions.Activities.Read).toBe('Activities.Activities.Read');
    expect(ActivitiesPermissions.Activities.Manage).toBe('Activities.Activities.Manage');
    expect(ActivitiesPermissions.Activities.Execute).toBe('Activities.Activities.Execute');
  });
});
