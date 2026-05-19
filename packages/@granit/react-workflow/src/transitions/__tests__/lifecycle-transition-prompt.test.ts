import { WorkflowLifecycleStatus } from '@granit/workflow';
import { describe, expect, it } from 'vitest';

import { buildLifecycleTransitionPrompt } from '../lifecycle-transition-prompt.js';

describe('buildLifecycleTransitionPrompt', () => {
  it('marks Published → Archived as destructive and requiring strong confirm', () => {
    const prompt = buildLifecycleTransitionPrompt(
      WorkflowLifecycleStatus.Published,
      WorkflowLifecycleStatus.Archived
    );

    expect(prompt.severity).toBe('destructive');
    expect(prompt.requiresStrongConfirm).toBe(true);
    expect(prompt.titleKey).toBe('workflow:Transition.PublishedToArchived.Title');
    expect(prompt.descriptionKey).toBe('workflow:Transition.PublishedToArchived.Description');
    expect(prompt.confirmLabelKey).toBe('workflow:Transition.PublishedToArchived.Confirm');
  });

  it('marks Draft → Published as info, no strong confirm', () => {
    const prompt = buildLifecycleTransitionPrompt(
      WorkflowLifecycleStatus.Draft,
      WorkflowLifecycleStatus.Published
    );

    expect(prompt.severity).toBe('info');
    expect(prompt.requiresStrongConfirm).toBe(false);
    expect(prompt.titleKey).toBe('workflow:Transition.DraftToPublished.Title');
  });

  it('marks transitions into PendingReview as warning', () => {
    const prompt = buildLifecycleTransitionPrompt(
      WorkflowLifecycleStatus.Draft,
      WorkflowLifecycleStatus.PendingReview
    );

    expect(prompt.severity).toBe('warning');
    expect(prompt.requiresStrongConfirm).toBe(false);
    expect(prompt.titleKey).toBe('workflow:Transition.DraftToPendingReview.Title');
  });

  it('returns a non-throwing generic prompt for unknown pairs', () => {
    const prompt = buildLifecycleTransitionPrompt(
      // Unknown status value — guard against future enum additions on the
      // backend the front doesn't recognize yet.
      99 as unknown as typeof WorkflowLifecycleStatus.Draft,
      99 as unknown as typeof WorkflowLifecycleStatus.Published
    );

    expect(prompt.severity).toBe('info');
    expect(prompt.requiresStrongConfirm).toBe(false);
    expect(prompt.titleKey).toBe('workflow:Transition.UnknownToUnknown.Title');
  });
});
