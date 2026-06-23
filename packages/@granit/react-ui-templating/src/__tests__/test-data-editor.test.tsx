import { screen } from '@testing-library/react';
import { useState } from 'react';

import { TestDataEditor } from '../components/test-data-editor';

import { renderWithProviders } from './test-utils';

describe('TestDataEditor', () => {
  it('should render a textarea with the provided value', () => {
    renderWithProviders(<TestDataEditor value='{ "key": "value" }' onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('{ "key": "value" }');
  });

  it('should call onChange when text is entered', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<TestDataEditor value="" onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('should show error after typing invalid JSON', async () => {
    // Use a stateful wrapper so the value prop updates after onChange
    function Wrapper() {
      const [val, setVal] = useState('');
      return <TestDataEditor value={val} onChange={setVal} />;
    }

    const { user } = renderWithProviders(<Wrapper />);

    await user.type(screen.getByRole('textbox'), '{{');
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not show error for valid JSON', () => {
    renderWithProviders(<TestDataEditor value='{ "valid": true }' onChange={vi.fn()} />);
    expect(screen.queryByText('Invalid JSON')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('should not show error for empty value', () => {
    renderWithProviders(<TestDataEditor value="" onChange={vi.fn()} />);
    expect(screen.queryByText('Invalid JSON')).not.toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    const { container } = renderWithProviders(<TestDataEditor value="" onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="test-data-editor"]')).toBeInTheDocument();
  });
});
