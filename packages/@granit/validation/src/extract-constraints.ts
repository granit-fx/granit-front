import type {
  ExtractOptions,
  FieldConstraint,
  OpenApiSchema,
  OpenApiSchemaProperty,
  OpenApiSpec,
  SchemaConstraints,
  SpecConstraints,
} from './types/index.js';

const MAX_REF_DEPTH = 10;

function resolveRef(
  ref: string,
  schemas: Readonly<Record<string, OpenApiSchema>>
): OpenApiSchema | undefined {
  const name = ref.replace('#/components/schemas/', '');
  return schemas[name];
}

interface ResolvedSchema {
  properties: Record<string, OpenApiSchemaProperty>;
  required: string[];
}

function collectRequired(required: readonly string[] | undefined, target: Set<string>): void {
  if (!required) return;
  for (const r of required) {
    target.add(r);
  }
}

function collectProperties(
  properties: Readonly<Record<string, OpenApiSchemaProperty>> | undefined,
  target: Record<string, OpenApiSchemaProperty>
): void {
  if (!properties) return;
  for (const [key, value] of Object.entries(properties)) {
    target[key] = value;
  }
}

function mergeResolvedSchema(
  resolved: ResolvedSchema,
  properties: Record<string, OpenApiSchemaProperty>,
  required: Set<string>
): void {
  collectProperties(resolved.properties, properties);
  collectRequired(resolved.required, required);
}

function processAllOfEntries(
  entries: readonly OpenApiSchema[],
  schemas: Readonly<Record<string, OpenApiSchema>>,
  depth: number,
  properties: Record<string, OpenApiSchemaProperty>,
  required: Set<string>
): void {
  for (const entry of entries) {
    if (entry.$ref) {
      const refSchema = resolveRef(entry.$ref, schemas);
      if (!refSchema) continue;
      mergeResolvedSchema(mergeAllOf(refSchema, schemas, depth + 1), properties, required);
      continue;
    }

    collectRequired(entry.required, required);
    collectProperties(entry.properties, properties);
  }
}

function mergeAllOf(
  schema: OpenApiSchema,
  schemas: Readonly<Record<string, OpenApiSchema>>,
  depth: number
): ResolvedSchema {
  const properties: Record<string, OpenApiSchemaProperty> = {};
  const required = new Set<string>();

  collectRequired(schema.required, required);
  collectProperties(schema.properties, properties);

  if (schema.allOf && depth < MAX_REF_DEPTH) {
    processAllOfEntries(schema.allOf, schemas, depth, properties, required);
  }

  return { properties, required: [...required] };
}

function buildFieldConstraint(prop: OpenApiSchemaProperty, isRequired: boolean): FieldConstraint {
  const constraint: Record<string, unknown> = {};

  if (isRequired) constraint['required'] = true;
  if (prop.maxLength !== undefined) constraint['maxLength'] = prop.maxLength;
  if (prop.minLength !== undefined) constraint['minLength'] = prop.minLength;
  if (prop.pattern !== undefined) constraint['pattern'] = prop.pattern;
  if (prop.format !== undefined) constraint['format'] = prop.format;
  if (prop.minimum !== undefined) constraint['minimum'] = prop.minimum;
  if (prop.maximum !== undefined) constraint['maximum'] = prop.maximum;
  if (prop.exclusiveMinimum !== undefined) constraint['exclusiveMinimum'] = prop.exclusiveMinimum;
  if (prop.exclusiveMaximum !== undefined) constraint['exclusiveMaximum'] = prop.exclusiveMaximum;
  if (prop['x-granit-validator'] !== undefined)
    constraint['granitValidator'] = prop['x-granit-validator'];
  if (prop['x-granit-pattern-hint'] !== undefined)
    constraint['patternHint'] = prop['x-granit-pattern-hint'];

  return constraint as FieldConstraint;
}

function filterSchemaNames(names: string[], options?: ExtractOptions): string[] {
  let filtered = names;

  if (options?.schemas) {
    const whitelist = new Set(options.schemas);
    filtered = filtered.filter((name) => whitelist.has(name));
  }

  if (options?.schemaPattern) {
    filtered = filtered.filter((name) => options.schemaPattern!.test(name));
  }

  return filtered;
}

/**
 * Extracts validation constraints from an OpenAPI spec.
 * Resolves `$ref` pointers and merges `allOf` compositions.
 */
export function extractConstraints(spec: OpenApiSpec, options?: ExtractOptions): SpecConstraints {
  const schemas = spec.components?.schemas ?? {};
  const result: Record<string, SchemaConstraints> = {};
  const schemaNames = filterSchemaNames(Object.keys(schemas), options);

  for (const name of schemaNames) {
    const schema = schemas[name]!;
    const { properties, required } = mergeAllOf(schema, schemas, 0);
    const requiredSet = new Set(required);

    const fields: Record<string, FieldConstraint> = {};

    for (const [fieldName, prop] of Object.entries(properties)) {
      fields[fieldName] = buildFieldConstraint(prop, requiredSet.has(fieldName));
    }

    if (Object.keys(fields).length > 0) {
      result[name] = fields;
    }
  }

  return result;
}
