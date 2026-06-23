export interface ScribanFilter {
  readonly label: string;
  readonly expression: (varName: string) => string;
  readonly description: string;
}

export interface ScribanFunction {
  readonly name: string;
  readonly expression: string;
  readonly description: string;
}

const STRING_FILTERS: readonly ScribanFilter[] = [
  { label: 'upcase', expression: (v) => `{{ ${v} | string.upcase }}`, description: 'UPPERCASE' },
  {
    label: 'downcase',
    expression: (v) => `{{ ${v} | string.downcase }}`,
    description: 'lowercase',
  },
  {
    label: 'capitalize',
    expression: (v) => `{{ ${v} | string.capitalize }}`,
    description: 'First Letter Cap',
  },
  {
    label: 'truncate',
    expression: (v) => `{{ ${v} | string.truncate 50 }}`,
    description: 'Truncate to 50 chars',
  },
  {
    label: 'strip',
    expression: (v) => `{{ ${v} | string.strip }}`,
    description: 'Remove whitespace',
  },
  {
    label: 'replace',
    expression: (v) => `{{ ${v} | string.replace "old" "new" }}`,
    description: 'Replace text',
  },
];

const DATE_FILTERS: readonly ScribanFilter[] = [
  {
    label: 'dd/MM/yyyy',
    expression: (v) => `{{ ${v} | date.to_string "%d/%m/%Y" }}`,
    description: '08/03/2026',
  },
  {
    label: 'dd MMM yyyy',
    expression: (v) => `{{ ${v} | date.to_string "%d %b %Y" }}`,
    description: '08 Mar 2026',
  },
  {
    label: 'yyyy-MM-dd',
    expression: (v) => `{{ ${v} | date.to_string "%Y-%m-%d" }}`,
    description: '2026-03-08',
  },
  {
    label: 'HH:mm',
    expression: (v) => `{{ ${v} | date.to_string "%H:%M" }}`,
    description: '14:30',
  },
  {
    label: 'dd/MM/yyyy HH:mm',
    expression: (v) => `{{ ${v} | date.to_string "%d/%m/%Y %H:%M" }}`,
    description: '08/03/2026 14:30',
  },
];

const NUMBER_FILTERS: readonly ScribanFilter[] = [
  {
    label: 'format N2',
    expression: (v) => `{{ ${v} | math.format "N2" }}`,
    description: '1 234,56',
  },
  {
    label: 'format N0',
    expression: (v) => `{{ ${v} | math.format "N0" }}`,
    description: '1 235',
  },
  {
    label: 'format C2',
    expression: (v) => `{{ ${v} | math.format "C2" }}`,
    description: '1 234,56 €',
  },
  { label: 'round', expression: (v) => `{{ ${v} | math.round 2 }}`, description: 'Round to 2' },
  { label: 'ceil', expression: (v) => `{{ ${v} | math.ceil }}`, description: 'Round up' },
  { label: 'floor', expression: (v) => `{{ ${v} | math.floor }}`, description: 'Round down' },
];

const BOOLEAN_FILTERS: readonly ScribanFilter[] = [
  {
    label: 'if/else',
    expression: (v) => `{{ if ${v} }}yes{{ else }}no{{ end }}`,
    description: 'Conditional text',
  },
];

export const SCRIBAN_FUNCTIONS: readonly ScribanFunction[] = [
  {
    name: 'if / else',
    expression: '{{ if condition }}\n  ...\n{{ else }}\n  ...\n{{ end }}',
    description: 'Conditional block',
  },
  {
    name: 'for',
    expression: '{{ for item in collection }}\n  {{ item.name }}\n{{ end }}',
    description: 'Loop over collection',
  },
  {
    name: 'capture',
    expression: '{{ capture variable }}\n  ...\n{{ end }}',
    description: 'Capture output to variable',
  },
  {
    name: 'include',
    expression: '{{ include "partial_name" }}',
    description: 'Include a partial template',
  },
];

export function getFiltersForType(type: string): readonly ScribanFilter[] {
  switch (type) {
    case 'DateTime':
      return DATE_FILTERS;
    case 'Decimal':
    case 'Double':
    case 'Single':
    case 'Int32':
    case 'Int64':
    case 'Int16':
      return NUMBER_FILTERS;
    case 'Boolean':
      return BOOLEAN_FILTERS;
    case 'String':
    default:
      return STRING_FILTERS;
  }
}
