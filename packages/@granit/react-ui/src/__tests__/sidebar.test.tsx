import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { SidebarProvider, SidebarTrigger, useSidebar } from '../sidebar.js';

function stubMatchMedia(matches = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }),
  });
}

function createWrapper(
  props?: React.ComponentProps<typeof SidebarProvider>
): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }) {
    return <SidebarProvider {...props}>{children}</SidebarProvider>;
  };
}

describe('sidebar', () => {
  beforeAll(() => {
    stubMatchMedia(false);
  });

  describe('useSidebar', () => {
    it('throws when used outside a SidebarProvider', () => {
      expect(() => renderHook(() => useSidebar())).toThrow(
        'useSidebar must be used within a SidebarProvider.'
      );
    });

    it('defaults to an expanded, open state', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper: createWrapper() });

      expect(result.current.open).toBe(true);
      expect(result.current.state).toBe('expanded');
    });

    it('honors defaultOpen=false (uncontrolled)', () => {
      const { result } = renderHook(() => useSidebar(), {
        wrapper: createWrapper({ defaultOpen: false }),
      });

      expect(result.current.open).toBe(false);
      expect(result.current.state).toBe('collapsed');
    });

    it('toggleSidebar flips state between expanded and collapsed', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper: createWrapper() });

      expect(result.current.state).toBe('expanded');

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.open).toBe(false);
      expect(result.current.state).toBe('collapsed');

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.open).toBe(true);
      expect(result.current.state).toBe('expanded');
    });

    it('setOpen updates the open state', () => {
      const { result } = renderHook(() => useSidebar(), { wrapper: createWrapper() });

      act(() => {
        result.current.setOpen(false);
      });
      expect(result.current.open).toBe(false);
      expect(result.current.state).toBe('collapsed');
    });
  });

  describe('controlled mode', () => {
    it('reflects the controlled open prop and never mutates it internally', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() => useSidebar(), {
        wrapper: createWrapper({ open: true, onOpenChange }),
      });

      expect(result.current.open).toBe(true);

      act(() => {
        result.current.setOpen(false);
      });

      // Controlled: internal state does not change, callback fires with the new value.
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(result.current.open).toBe(true);
    });

    it('toggleSidebar invokes onOpenChange with the negated value', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() => useSidebar(), {
        wrapper: createWrapper({ open: false, onOpenChange }),
      });

      act(() => {
        result.current.toggleSidebar();
      });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('keyboard shortcut', () => {
    it('Ctrl+B toggles the sidebar', async () => {
      const user = userEvent.setup();
      let snapshot: ReturnType<typeof useSidebar> | undefined;

      function Probe() {
        snapshot = useSidebar();
        return null;
      }

      render(
        <SidebarProvider>
          <Probe />
        </SidebarProvider>
      );

      expect(snapshot?.state).toBe('expanded');

      await act(async () => {
        await user.keyboard('{Control>}b{/Control}');
      });

      expect(snapshot?.state).toBe('collapsed');
    });

    it('Meta+B toggles the sidebar', async () => {
      const user = userEvent.setup();
      let snapshot: ReturnType<typeof useSidebar> | undefined;

      function Probe() {
        snapshot = useSidebar();
        return null;
      }

      render(
        <SidebarProvider defaultOpen={false}>
          <Probe />
        </SidebarProvider>
      );

      expect(snapshot?.state).toBe('collapsed');

      await act(async () => {
        await user.keyboard('{Meta>}b{/Meta}');
      });

      expect(snapshot?.state).toBe('expanded');
    });
  });

  describe('SidebarTrigger', () => {
    it('toggles the sidebar and calls the supplied onClick', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      let snapshot: ReturnType<typeof useSidebar> | undefined;

      function Probe() {
        snapshot = useSidebar();
        return null;
      }

      render(
        <SidebarProvider>
          <Probe />
          <SidebarTrigger onClick={onClick} />
        </SidebarProvider>
      );

      expect(snapshot?.state).toBe('expanded');

      await user.click(screen.getByRole('button', { name: /toggle sidebar/i }));

      expect(onClick).toHaveBeenCalledOnce();
      expect(snapshot?.state).toBe('collapsed');
    });
  });
});
