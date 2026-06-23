import { useState } from 'react';

import { TemplateEditor } from './template-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';

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

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(SAMPLE_CONTENT);
    return <TemplateEditor {...args} value={value} onChange={setValue} />;
  },
};

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <TemplateEditor {...args} value={value} onChange={setValue} />;
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: SAMPLE_CONTENT,
    onChange: () => {},
  },
};
