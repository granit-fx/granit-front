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
});
