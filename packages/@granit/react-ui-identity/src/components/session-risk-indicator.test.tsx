import { TooltipProvider } from '@granit/react-ui';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionRiskIndicator } from './session-risk-indicator';

import type { RiskLabelStrings } from './use-risk-label-strings';

const labels: RiskLabelStrings = {
  title: 'Elevated risk',
  level: (level) => level,
  reason: (code) => (code === 'new_location' ? 'New location' : code),
};

function renderIndicator(props: Partial<Parameters<typeof SessionRiskIndicator>[0]> = {}) {
  return render(
    <TooltipProvider>
      <SessionRiskIndicator level="Low" reasons={['new_location']} labels={labels} {...props} />
    </TooltipProvider>
  );
}

describe('SessionRiskIndicator', () => {
  it('should render nothing for a None or null level', () => {
    const { container, rerender } = renderIndicator({ level: 'None' });
    expect(container).toBeEmptyDOMElement();

    rerender(
      <TooltipProvider>
        <SessionRiskIndicator level={null} reasons={null} labels={labels} />
      </TooltipProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should expose level and translated reasons as the accessible name', () => {
    renderIndicator({ level: 'High', reasons: ['new_location', 'anomaly'] });
    expect(
      screen.getByRole('button', { name: 'Elevated risk: High. New location, anomaly' })
    ).toBeInTheDocument();
  });

  it('should be keyboard focusable as a native button', () => {
    renderIndicator();
    // A <button> is focusable by default — no explicit tabindex needed.
    const trigger = screen.getByRole('button');
    expect(trigger).not.toHaveAttribute('tabindex');
    trigger.focus();
    expect(trigger).toHaveFocus();
  });
});
