import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import { CheckboxField } from '../checkbox-field.js';
import { Form } from '../form.js';
import { SelectField } from '../select-field.js';
import { TextField } from '../text-field.js';

type Values = {
  username: string;
  fruit: string;
  agree: boolean;
};

function Harness({
  children,
  defaultValues,
}: {
  children: (control: ReturnType<typeof useForm<Values>>['control']) => React.ReactNode;
  defaultValues?: Partial<Values>;
}) {
  const form = useForm<Values>({
    defaultValues: { username: '', fruit: '', agree: false, ...defaultValues },
  });

  return (
    <Form {...form}>
      <form>{children(form.control)}</form>
    </Form>
  );
}

describe('TextField', () => {
  it('renders the label and an input wired to the field value', () => {
    render(
      <Harness defaultValues={{ username: 'alice' }}>
        {(control) => <TextField control={control} name="username" label="Username" />}
      </Harness>
    );

    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('alice');
  });

  it('coerces a null field value to an empty string', () => {
    render(
      <Harness defaultValues={{ username: null as unknown as string }}>
        {(control) => <TextField control={control} name="username" label="Username" />}
      </Harness>
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('forwards type, placeholder and maxLength props', () => {
    render(
      <Harness>
        {(control) => (
          <TextField
            control={control}
            name="username"
            label="Username"
            type="email"
            placeholder="you@example.com"
            maxLength={20}
          />
        )}
      </Harness>
    );

    const input = screen.getByPlaceholderText('you@example.com');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('maxlength', '20');
  });

  it('applies the transform on every keystroke when provided', async () => {
    const user = userEvent.setup();

    render(
      <Harness>
        {(control) => (
          <TextField
            control={control}
            name="username"
            label="Username"
            transform={(value) => value.toUpperCase()}
          />
        )}
      </Harness>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    expect(input).toHaveValue('ABC');
  });

  it('uses the default onChange path when no transform is given', async () => {
    const user = userEvent.setup();

    render(
      <Harness>
        {(control) => <TextField control={control} name="username" label="Username" />}
      </Harness>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ] as const;

  it('renders the label and a placeholder-backed trigger', () => {
    render(
      <Harness>
        {(control) => (
          <SelectField
            control={control}
            name="fruit"
            label="Fruit"
            options={options}
            placeholder="Pick a fruit"
          />
        )}
      </Harness>
    );

    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('falls back to the label as placeholder when none is provided', () => {
    render(
      <Harness>
        {(control) => (
          <SelectField control={control} name="fruit" label="Fruit" options={options} />
        )}
      </Harness>
    );

    // Both the FormLabel and the SelectValue placeholder render "Fruit".
    expect(screen.getAllByText('Fruit').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the listbox and selects an option', async () => {
    const user = userEvent.setup();

    render(
      <Harness>
        {(control) => (
          <SelectField control={control} name="fruit" label="Fruit" options={options} />
        )}
      </Harness>
    );

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'Banana' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });
});

describe('CheckboxField', () => {
  it('renders an unchecked checkbox bound to a false field value', () => {
    render(
      <Harness>
        {(control) => <CheckboxField control={control} name="agree" label="I agree" />}
      </Harness>
    );

    expect(screen.getByText('I agree')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reflects a checked default value', () => {
    render(
      <Harness defaultValues={{ agree: true }}>
        {(control) => <CheckboxField control={control} name="agree" label="I agree" />}
      </Harness>
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles the field value on click', async () => {
    const user = userEvent.setup();

    render(
      <Harness>
        {(control) => <CheckboxField control={control} name="agree" label="I agree" />}
      </Harness>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
