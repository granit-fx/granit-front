import { describe, expect, it } from 'vitest';

import { ActivitiesPermissions } from '../permissions';

describe('ActivitiesPermissions', () => {
  it('exposes all five Activities permission keys matching the backend', () => {
    expect(ActivitiesPermissions.Activities.Read).toBe('Activities.Activities.Read');
    expect(ActivitiesPermissions.Activities.ReadOthers).toBe('Activities.Activities.ReadOthers');
    expect(ActivitiesPermissions.Activities.Manage).toBe('Activities.Activities.Manage');
    expect(ActivitiesPermissions.Activities.Reassign).toBe('Activities.Activities.Reassign');
    expect(ActivitiesPermissions.Activities.Execute).toBe('Activities.Activities.Execute');
  });
});
