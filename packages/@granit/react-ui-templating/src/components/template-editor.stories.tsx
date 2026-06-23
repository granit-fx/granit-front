import { useState } from 'react';

import { TemplateEditor } from './template-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

const meta: Meta<typeof TemplateEditor> = {
  title: 'Features/Templates/TemplateEditor',
  component: TemplateEditor,
  tags: ['autodocs'],
  argTypes: {
    readOnly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_CONTENT = `<h1>{{ model.title }}</h1>

{{ if model.items }}
<ul>
  {{ for item in model.items }}
  <li>{{ item.name }} — {{ item.price | math.format "0.00" }} EUR</li>
  {{ end }}
</ul>
{{ end }}

<footer>Généré le {{ now.date }}</footer>`;

function TemplateEditorWithState(
  args: Readonly<Partial<ComponentProps<typeof TemplateEditor>> & { initialValue?: string }>
) {
  const { initialValue = '', ...rest } = args;
  const [value, setValue] = useState(initialValue);
  return <TemplateEditor {...rest} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <TemplateEditorWithState {...args} initialValue={SAMPLE_CONTENT} />,
};

export const Empty: Story = {
  render: (args) => <TemplateEditorWithState {...args} initialValue="" />,
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: SAMPLE_CONTENT,
    onChange: () => {},
  },
};
