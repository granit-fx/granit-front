# @granit/validation

OpenAPI constraint extraction, field validation, input prop generation, and server-side validation API. Mirrors `Granit.Validation` .NET contract.

## Installation

```bash
pnpm add @granit/validation
```

## API

### Types

- `OpenApiSpec`, `OpenApiSchema`, `OpenApiSchemaProperty`, `OpenApiSchemaRef` -- OpenAPI schema types
- `FieldConstraint`, `SchemaConstraints`, `SpecConstraints` -- extracted constraints
- `InputConstraintProps`, `ExtractOptions` -- input generation
- `ServerValidationRequest`, `ServerValidationResult`, `ServerValidationBatchRequest`, `ServerValidationBatchResponse` -- server validation
- `FieldValidationError`, `ValidationStatus` -- validation state

### Constants

- `VALIDATION_ERROR_CODES` -- standard error code constants

### Functions

- `extractConstraints(spec, options?)` -- extract field constraints from OpenAPI spec
- `getInputProps(constraint)` -- generate HTML input attributes from constraints
- `validateField(value, constraint)` -- client-side field validation
- `fetchValidators(...)`, `validateFieldServer(...)`, `validateFieldsBatch(...)` -- server-side validation

## Usage

```ts
import { extractConstraints, getInputProps } from '@granit/validation';

const constraints = extractConstraints(openApiSpec, { schema: 'CreateUserRequest' });
const emailProps = getInputProps(constraints.email);
// { type: 'email', required: true, maxLength: 256 }
```

## License

Apache-2.0
