import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityActionModalHost, useEntityActionModal } from '@granit/react-entities';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { ActionModal } from './action-modal';
import { EntityActionScopeProvider } from './entity-action-scope';

import type { EntityActionManifest } from '@granit/entities';
import type { EntityActionOverlayState } from '@granit/react-entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const stubClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// ---------------------------------------------------------------------------
// Helper wrapper — opens the modal immediately so the Dialog is visible in
// the canvas. Uses EntityActionModalHost's internal open() to seed state.
// ---------------------------------------------------------------------------

interface StoryWrapperProps {
  readonly initialState: EntityActionOverlayState | null;
  readonly children: React.ReactNode;
}

function OpenModalWrapper({ initialState, children }: StoryWrapperProps) {
  const [started, setStarted] = React.useState(false);
  const openRef = React.useRef<((state: EntityActionOverlayState) => void) | null>(null);

  // We cannot call open() until the context tree is mounted; use a child
  // component that reads the context and forwards the ref.
  return (
    <EntityActionModalHost>
      <ModalOpenerBridge
        initialState={initialState}
        started={started}
        setStarted={setStarted}
        openRef={openRef}
      />
      {children}
    </EntityActionModalHost>
  );
}

interface BridgeProps {
  readonly initialState: EntityActionOverlayState | null;
  readonly started: boolean;
  readonly setStarted: (v: boolean) => void;
  readonly openRef: React.MutableRefObject<((state: EntityActionOverlayState) => void) | null>;
}

function ModalOpenerBridge({ initialState, started, setStarted, openRef }: BridgeProps) {
  // Dynamically import the hook so the bridge is inside the provider tree.
  const { open } = useModalContext();
  React.useEffect(() => {
    openRef.current = open;
  }, [open, openRef]);
  React.useEffect(() => {
    if (!started && initialState) {
      open(initialState);
      setStarted(true);
    }
  }, [started, initialState, open, setStarted]);
  return null;
}

function useModalContext() {
  return useEntityActionModal();
}

// ---------------------------------------------------------------------------
// Action fixtures
// ---------------------------------------------------------------------------

const confirmAction: EntityActionManifest = {
  name: 'Archive',
  kind: 'OpenModal',
  displayKey: null,
  icon: 'archive',
  order: 1,
  urlTemplate: null,
  httpMethod: null,
  confirmationKey: 'Common.SelectionAction.ConfirmDefault',
  workflowTransitionName: null,
  contributorAssemblyName: null,
};

const iframeAction: EntityActionManifest = {
  name: 'Import',
  kind: 'OpenModal',
  displayKey: null,
  icon: 'upload',
  order: 2,
  urlTemplate: 'https://example.com/import?token=demo',
  httpMethod: null,
  confirmationKey: null,
  workflowTransitionName: null,
  contributorAssemblyName: null,
};

// ---------------------------------------------------------------------------
// Decorator factory
// ---------------------------------------------------------------------------

function withProviders(Story: React.ComponentType) {
  const qc = makeQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <GranitClientProvider client={stubClient}>
        <EntityActionScopeProvider>
          <Story />
        </EntityActionScopeProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ActionModal> = {
  title: 'Shared Components/ActionModal',
  component: ActionModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal overlay for `OpenModal` entity actions. Renders an inline EntityForm (when `urlTemplate` is null) or a sandboxed iframe for server-rendered wizards.',
      },
    },
  },
  decorators: [withProviders],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Closed state — the Dialog is not visible because no action has been
 * dispatched yet. Demonstrates the component mounts without errors when
 * idle.
 */
export const Closed: Story = {
  decorators: [
    (Story) => (
      <EntityActionModalHost>
        <Story />
      </EntityActionModalHost>
    ),
  ],
  render: () => <ActionModal />,
};

/**
 * Modal open with a confirmation message and no URL template. The form body
 * falls through to "no entity scope" because no entity name is set in the
 * scope context.
 */
export const OpenWithConfirmation: Story = {
  decorators: [
    (Story) => (
      <OpenModalWrapper initialState={{ action: confirmAction, rowId: null, row: null }}>
        <Story />
      </OpenModalWrapper>
    ),
  ],
  render: () => <ActionModal />,
};

/**
 * Modal open with a static iframe URL (no `{id}` substitution). The iframe
 * branch renders because `urlTemplate` is non-null.
 */
export const OpenWithIframe: Story = {
  decorators: [
    (Story) => (
      <OpenModalWrapper initialState={{ action: iframeAction, rowId: null, row: null }}>
        <Story />
      </OpenModalWrapper>
    ),
  ],
  render: () => <ActionModal />,
};
