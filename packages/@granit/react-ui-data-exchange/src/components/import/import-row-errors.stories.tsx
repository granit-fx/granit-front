import { ImportRowErrors } from './import-row-errors';

import type { ImportRowError } from '@granit/data-exchange';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataExchange/ImportRowErrors',
  component: ImportRowErrors,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ImportRowErrors>;

export default meta;
type Story = StoryObj<typeof meta>;

const mixedErrors: ImportRowError[] = [
  {
    rowNumber: 3,
    kind: 'Validation',
    errorCodes: ['REQUIRED_FIELD'],
    message: 'Field "name" is required and cannot be empty.',
  },
  {
    rowNumber: 7,
    kind: 'Conversion',
    errorCodes: ['INVALID_DATE'],
    message: 'Cannot parse "31/13/2026" as a valid date.',
  },
  {
    rowNumber: 12,
    kind: 'Identity',
    errorCodes: ['DUPLICATE_KEY'],
    message: 'A record with code "BE" already exists.',
  },
  {
    rowNumber: 18,
    kind: 'Persistence',
    errorCodes: ['FK_VIOLATION'],
    message: 'Referenced region "UNKNOWN" does not exist.',
  },
  {
    rowNumber: 24,
    kind: 'Validation',
    errorCodes: ['MAX_LENGTH'],
    message: 'Field "description" exceeds maximum length of 255 characters.',
  },
];

const validationOnlyErrors: ImportRowError[] = [
  {
    rowNumber: 2,
    kind: 'Validation',
    errorCodes: ['REQUIRED_FIELD'],
    message: 'Field "iso2" is required.',
  },
  {
    rowNumber: 5,
    kind: 'Validation',
    errorCodes: ['PATTERN_MISMATCH'],
    message: 'Field "iso2" must be exactly 2 uppercase letters.',
  },
  {
    rowNumber: 9,
    kind: 'Validation',
    errorCodes: ['MAX_LENGTH'],
    message: 'Field "name" exceeds maximum length of 100 characters.',
  },
];

const ERROR_KINDS = ['Validation', 'Conversion', 'Identity', 'Persistence'] as const;

const manyErrors: ImportRowError[] = Array.from({ length: 75 }, (_, i) => ({
  rowNumber: i + 1,
  kind: ERROR_KINDS[i % ERROR_KINDS.length] ?? 'Validation',
  errorCodes: ['ERR_CODE'],
  message: `Row ${i + 1}: simulated error for testing truncation display.`,
}));

export const Default: Story = {
  args: {
    errors: mixedErrors,
  },
};

export const ValidationErrors: Story = {
  args: {
    errors: validationOnlyErrors,
  },
};

export const TruncatedList: Story = {
  args: {
    errors: manyErrors,
    maxDisplay: 50,
  },
};

export const Empty: Story = {
  args: {
    errors: [],
  },
};
