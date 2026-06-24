import { Form } from '@granit/react-ui';
import { useForm } from 'react-hook-form';

import { MetadataEditor } from './metadata-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';

interface MetadataFormValues {
  metadata: { key: string; value: string }[];
}

function MetadataEditorHarness(props: {
  readonly initial?: MetadataFormValues['metadata'];
  readonly suggestions?: string[];
}) {
  const form = useForm<MetadataFormValues>({
    // Story-only passthrough resolver (the editor itself validates nothing here).
    resolver: (values) => ({ values, errors: {} }),
    defaultValues: { metadata: props.initial ?? [] },
  });

  return (
    <Form {...form}>
      <form className="w-[32rem]">
        <MetadataEditor form={form} i18nPrefix="Countries" suggestions={props.suggestions} />
      </form>
    </Form>
  );
}

const meta: Meta<typeof MetadataEditorHarness> = {
  title: 'Features/ReferenceData/MetadataEditor',
  component: MetadataEditorHarness,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MetadataEditorHarness>;

export const Empty: Story = {};

export const WithEntries: Story = {
  args: {
    initial: [
      { key: 'region', value: 'EU' },
      { key: 'iso3', value: 'FRA' },
    ],
  },
};

export const WithSuggestions: Story = {
  args: { suggestions: ['region', 'iso3', 'capital', 'currency'] },
};
