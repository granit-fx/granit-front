import { useState } from 'react';

import { RichTextEditor } from './rich-text-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Features/Templates/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  argTypes: {
    readOnly: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function RichTextEditorWithState(props: Readonly<{ value?: string; readOnly?: boolean }>) {
  const [value, setValue] = useState(
    props.value ?? '<h1>Invoice Template</h1><p>Hello <strong>{{ model.name }}</strong>,</p>'
  );
  return <RichTextEditor value={value} onChange={setValue} readOnly={props.readOnly} />;
}

export const Default: Story = {
  render: () => <RichTextEditorWithState />,
};

export const ReadOnly: Story = {
  render: () => (
    <RichTextEditorWithState
      value="<h1>Read-only content</h1><p>This editor is <em>not editable</em>.</p>"
      readOnly
    />
  ),
};

export const Empty: Story = {
  render: () => <RichTextEditorWithState value="" />,
};
