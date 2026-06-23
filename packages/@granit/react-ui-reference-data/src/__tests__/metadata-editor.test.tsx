import { Form } from '@granit/react-ui';
import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { MetadataEditor } from '../components/metadata-editor';

import { renderWithProviders } from './test-utils';

interface HarnessValues {
  metadata: { key: string; value: string }[];
}

function Harness({
  suggestions,
  defaultMetadata = [],
}: {
  readonly suggestions?: string[];
  readonly defaultMetadata?: { key: string; value: string }[];
}) {
  const form = useForm<HarnessValues>({ defaultValues: { metadata: defaultMetadata } });
  return (
    <Form {...form}>
      <form>
        <MetadataEditor form={form} suggestions={suggestions} />
      </form>
    </Form>
  );
}

describe('MetadataEditor', () => {
  it('renders the empty-state message when there are no rows', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByText('No metadata defined')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="metadata-editor"]')).toBeInTheDocument();
  });

  it('appends a new row when clicking add property', async () => {
    const { user } = renderWithProviders(<Harness />);
    await user.click(screen.getByRole('button', { name: /Add property/ }));
    expect(screen.getByPlaceholderText('Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Value')).toBeInTheDocument();
    expect(screen.queryByText('No metadata defined')).not.toBeInTheDocument();
  });

  it('renders existing rows from default values', () => {
    renderWithProviders(<Harness defaultMetadata={[{ key: 'iso2', value: 'BE' }]} />);
    expect(screen.getByDisplayValue('iso2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('BE')).toBeInTheDocument();
  });

  it('removes a row when clicking the trash button', async () => {
    const { user } = renderWithProviders(
      <Harness defaultMetadata={[{ key: 'iso2', value: 'BE' }]} />
    );
    expect(screen.getByDisplayValue('iso2')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);
    expect(screen.queryByDisplayValue('iso2')).not.toBeInTheDocument();
    expect(screen.getByText('No metadata defined')).toBeInTheDocument();
  });

  it('renders a datalist with suggestions when provided', () => {
    renderWithProviders(
      <Harness suggestions={['iso2', 'iso3']} defaultMetadata={[{ key: '', value: '' }]} />
    );
    const datalist = document.querySelector('datalist#metadata-suggestions');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll('option')).toHaveLength(2);
  });

  it('omits the datalist when no suggestions are given', () => {
    renderWithProviders(<Harness defaultMetadata={[{ key: '', value: '' }]} />);
    expect(document.querySelector('datalist')).not.toBeInTheDocument();
  });
});
