import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../form.js';
import { Input } from '../input.js';

type Values = { username: string };

function Harness({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit?: (values: Values) => void;
}) {
  const form = useForm<Values>({ defaultValues: { username: '' } });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>{children}</form>
    </Form>
  );
}

describe('form', () => {
  it('wires htmlFor/id/aria via useFormField', () => {
    render(
      <Harness>
        <FormField
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Harness>
    );

    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');

    const htmlFor = label.getAttribute('for');
    expect(htmlFor).toBeTruthy();
    expect(input.getAttribute('id')).toBe(htmlFor);
    expect(input.getAttribute('aria-describedby')).toContain('form-item-description');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders the field error message and flags aria-invalid after a failed submit', async () => {
    const user = userEvent.setup();

    render(
      <Harness>
        <FormField
          name="username"
          rules={{ required: 'Username is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </Harness>
    );

    expect(screen.queryByText('Username is required')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Username').getAttribute('data-error')).toBe('true');
  });

  it('FormMessage renders explicit children when there is no error', () => {
    render(
      <Harness>
        <FormField
          name="username"
          render={() => (
            <FormItem>
              <FormMessage>Helper text</FormMessage>
            </FormItem>
          )}
        />
      </Harness>
    );

    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('useFormField throws when used outside a FormProvider', () => {
    expect(() => renderHook(() => useFormField())).toThrow();
  });
});
