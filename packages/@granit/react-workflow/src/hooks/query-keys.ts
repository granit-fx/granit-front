import type { WorkflowConfig } from '../providers/workflow-provider';

/** Builds a consistent React Query key for workflow operations. */
export function buildWorkflowQueryKey(
  config: WorkflowConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['workflow'];
  return [...prefix, ...segments];
}
