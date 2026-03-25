# @granit/react-validation

React bindings for `@granit/validation` -- OpenAPI constraint resolution, field props generation, server-side validation.

## Installation

```bash
pnpm add @granit/react-validation
```

## API

### Functions

- `createConstraintsResolver(spec, options?)` -- create a resolver that extracts field constraints from an OpenAPI spec

### Hooks

- `useFieldProps(constraint)` -- generate HTML input attributes from a field constraint
- `useServerValidation(options?)` -- server-side field validation with debouncing

### Types

- `ConstraintsResolver`, `TranslateFunction` -- resolver types
- `FieldPropsResult` -- input props result
- `ServerValidationState`, `UseServerValidationOptions` -- server validation state

## Usage

```tsx
import {
  createConstraintsResolver,
  useFieldProps,
  useServerValidation,
} from '@granit/react-validation';

const resolver = createConstraintsResolver(openApiSpec, { schema: 'CreateUserRequest' });

function EmailInput() {
  const props = useFieldProps(resolver.email);
  const { error, validate } = useServerValidation({ field: 'email' });

  return <input {...props} onChange={(e) => validate(e.target.value)} />;
}
```

## License

Apache-2.0
