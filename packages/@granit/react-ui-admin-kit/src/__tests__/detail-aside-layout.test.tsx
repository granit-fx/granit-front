import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DetailAsideLayout, DetailAsideMobileTrigger } from '../layout/detail-aside-layout';

import { renderWithI18n, setupI18n } from './test-utils';

// The shared jsdom setup stubs `matchMedia` with `matches: false`, so the layout
// mounts in its below-`lg` (mobile) configuration: the inline panel is hidden and
// the aside is reachable through the Sheet opened by the mobile trigger.

beforeAll(setupI18n);

describe('DetailAsideLayout', () => {
  it('renders the main content and the layout slots', () => {
    renderWithI18n(
      <DetailAsideLayout asideTitle="Activity" aside={<div>aside body</div>}>
        <div>main body</div>
      </DetailAsideLayout>
    );

    expect(screen.getByText('main body')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="detail-aside-layout"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="detail-aside-grid"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="detail-aside-main"]')).toBeInTheDocument();
  });

  it('renders the optional header row when provided', () => {
    renderWithI18n(
      <DetailAsideLayout
        asideTitle="Activity"
        aside={<div>aside body</div>}
        header={<h1>Title</h1>}
      >
        <div>main body</div>
      </DetailAsideLayout>
    );

    expect(document.querySelector('[data-slot="detail-aside-header"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  });

  it('opens the aside Sheet from the mobile trigger', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <DetailAsideLayout
        asideTitle="Activity"
        aside={<div>aside body</div>}
        header={<DetailAsideMobileTrigger />}
      >
        <div>main body</div>
      </DetailAsideLayout>
    );

    await user.click(screen.getByRole('button', { name: 'Activity' }));

    expect(await screen.findByText('aside body')).toBeInTheDocument();
  });

  it('uses an explicit trigger label over the aside title', () => {
    renderWithI18n(
      <DetailAsideLayout
        asideTitle="Activity"
        aside={<div>aside body</div>}
        header={<DetailAsideMobileTrigger label="History" />}
      >
        <div>main body</div>
      </DetailAsideLayout>
    );

    expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument();
  });

  it('throws when the mobile trigger is rendered outside the layout', () => {
    expect(() => renderWithI18n(<DetailAsideMobileTrigger />)).toThrow(
      /must be rendered inside <DetailAsideLayout>/
    );
  });

  describe('on desktop (lg+) breakpoint', () => {
    // Override the shared `matchMedia` stub so the desktop media query matches,
    // mounting the inline (non-Sheet) panel with its collapse/expand controls.
    const original = window.matchMedia;
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener,
        removeEventListener,
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = original;
      localStorage.clear();
      addEventListener.mockClear();
      removeEventListener.mockClear();
    });

    it('renders the inline aside panel expanded and collapses it', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <DetailAsideLayout asideTitle="Activity" aside={<div>aside body</div>}>
          <div>main body</div>
        </DetailAsideLayout>
      );

      // Inline panel is mounted (single mount per breakpoint), aside is visible.
      const panel = document.querySelector('[data-slot="detail-aside-panel"]');
      expect(panel).toHaveAttribute('data-state', 'open');
      expect(screen.getByText('aside body')).toBeInTheDocument();

      // Collapse the panel.
      await user.click(screen.getByRole('button', { name: 'Common.Collapse' }));
      expect(document.querySelector('[data-slot="detail-aside-panel"]')).toHaveAttribute(
        'data-state',
        'collapsed'
      );

      // The collapsed rail exposes an expand button labelled by the aside title.
      await user.click(screen.getByRole('button', { name: 'Activity' }));
      expect(document.querySelector('[data-slot="detail-aside-panel"]')).toHaveAttribute(
        'data-state',
        'open'
      );
    });

    it('subscribes to media query changes and cleans up on unmount', () => {
      const { unmount } = renderWithI18n(
        <DetailAsideLayout asideTitle="Activity" aside={<div>aside body</div>}>
          <div>main body</div>
        </DetailAsideLayout>
      );
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      unmount();
      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('respects a persisted collapsed state from localStorage', () => {
      localStorage.setItem('granit:detail-aside-open', 'false');
      renderWithI18n(
        <DetailAsideLayout asideTitle="Activity" aside={<div>aside body</div>}>
          <div>main body</div>
        </DetailAsideLayout>
      );
      expect(document.querySelector('[data-slot="detail-aside-panel"]')).toHaveAttribute(
        'data-state',
        'collapsed'
      );
    });
  });
});
