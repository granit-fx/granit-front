import * as ts from 'typescript';

/** A single contract-conformance violation between a backend schema and a front type. */
export interface ConformanceViolation {
  /** Stable rule id (`missing-field`, `type-family`, `nullability`, `orphan-field`, …). */
  rule: string;
  /** Backend schema name being checked. */
  schema: string;
  /** Offending field (`*` for whole-type violations). */
  field: string;
  /** Human-readable explanation, ready to surface in an assertion message. */
  message: string;
}

/** Coarse type family — the level at which the contract (not the representation) is compared. */
type Family = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown';

/**
 * Brands the framework layers over primitives that OpenAPI can't express.
 * The contract is about the *family*, so a branded `ISODateString` satisfies a
 * `string` schema. Extend as new brands appear.
 */
const BRAND_FAMILY: Record<string, Family> = {
  ISODateString: 'string',
};

interface PropShape {
  family: Family;
  nullable: boolean;
}

// --- OpenAPI side ----------------------------------------------------------

interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  nullable?: boolean;
  enum?: readonly unknown[];
  $ref?: string;
  required?: readonly string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
}

export interface OpenApiDocument {
  components?: { schemas?: Record<string, OpenApiSchema> };
}

/**
 * Normalization table — collapses the spec's representation warts to the curated
 * family the framework actually exposes:
 *   - `["integer","string"]` (int32/int64 serialized loosely) → `number`
 *   - `string` + `format: date-time|uuid`                     → `string`
 *   - string `enum` / const                                   → `string`
 *   - `["null", T]` / `nullable: true`                        → nullable
 */
function specFamily(schema: OpenApiSchema): PropShape {
  let nullable = schema.nullable === true;
  let type = schema.type;
  if (Array.isArray(type)) {
    nullable = nullable || type.includes('null');
    type = type.find((t) => t !== 'null');
  }

  let family: Family;
  if (schema.$ref) family = 'object';
  else if (schema.enum) family = 'string';
  else if (type === 'string') family = 'string';
  else if (type === 'integer' || type === 'number') family = 'number';
  else if (type === 'boolean') family = 'boolean';
  else if (type === 'array') family = 'array';
  else if (type === 'object') family = 'object';
  else family = 'unknown';

  return { family, nullable };
}

function specProps(schema: OpenApiSchema): Map<string, PropShape & { required: boolean }> {
  const required = new Set(schema.required ?? []);
  const out = new Map<string, PropShape & { required: boolean }>();
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    out.set(name, { ...specFamily(prop), required: required.has(name) });
  }
  return out;
}

// --- TypeScript side -------------------------------------------------------

function baseFamily(node: ts.TypeNode): Family {
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
    return baseFamily(node.type);
  }
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    default:
      break;
  }
  if (ts.isArrayTypeNode(node)) return 'array';
  if (ts.isLiteralTypeNode(node)) {
    const lit = node.literal.kind;
    if (lit === ts.SyntaxKind.StringLiteral) return 'string';
    if (lit === ts.SyntaxKind.NumericLiteral) return 'number';
    if (lit === ts.SyntaxKind.TrueKeyword || lit === ts.SyntaxKind.FalseKeyword) return 'boolean';
  }
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    if (name === 'Array' || name === 'ReadonlyArray') return 'array';
    return BRAND_FAMILY[name] ?? 'object';
  }
  if (ts.isTypeLiteralNode(node)) return 'object';
  return 'unknown';
}

function tsFamily(typeNode: ts.TypeNode): PropShape {
  if (!ts.isUnionTypeNode(typeNode)) return { family: baseFamily(typeNode), nullable: false };

  let nullable = false;
  const bases: ts.TypeNode[] = [];
  for (const member of typeNode.types) {
    const isNull =
      member.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isLiteralTypeNode(member) && member.literal.kind === ts.SyntaxKind.NullKeyword);
    if (isNull || member.kind === ts.SyntaxKind.UndefinedKeyword) {
      nullable = true;
      continue;
    }
    bases.push(member);
  }
  const first = bases[0];
  return { family: first ? baseFamily(first) : 'unknown', nullable };
}

function findInterface(
  sourceText: string,
  fileName: string,
  typeName: string
): ts.InterfaceDeclaration | undefined {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  let found: ts.InterfaceDeclaration | undefined;
  sf.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) found = node;
  });
  return found;
}

function tsProps(iface: ts.InterfaceDeclaration): Map<string, PropShape> {
  const out = new Map<string, PropShape>();
  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const shape = tsFamily(member.type);
    out.set(member.name.getText(), {
      family: shape.family,
      nullable: shape.nullable || member.questionToken !== undefined,
    });
  }
  return out;
}

// --- Oracle ----------------------------------------------------------------

export interface CheckSchemaOptions {
  /** Parsed OpenAPI document (a vendored `contracts/openapi/<module>.json`). */
  spec: OpenApiDocument;
  /** Schema name in `components.schemas`. */
  schemaName: string;
  /** Raw text of the TS file declaring the front type. */
  sourceText: string;
  /** Path of that file (used in messages and TS parsing). */
  fileName: string;
  /** Front interface name. Defaults to `schemaName`. */
  typeName?: string;
}

/**
 * Verify a hand-written front interface conforms to its backend OpenAPI schema —
 * field presence, nullability and coarse type family — while tolerating the
 * spec's representation (int unions, branded primitives, materialized generics)
 * via the normalization table. Returns one {@link ConformanceViolation} per drift;
 * an empty array means the front type still mirrors the contract.
 */
export function checkSchemaConformance(opts: CheckSchemaOptions): ConformanceViolation[] {
  const typeName = opts.typeName ?? opts.schemaName;
  const out: ConformanceViolation[] = [];

  const schema = opts.spec.components?.schemas?.[opts.schemaName];
  if (!schema) {
    return [
      {
        rule: 'schema-missing',
        schema: opts.schemaName,
        field: '*',
        message: `the spec has no schema "${opts.schemaName}"`,
      },
    ];
  }

  const iface = findInterface(opts.sourceText, opts.fileName, typeName);
  if (!iface) {
    return [
      {
        rule: 'type-missing',
        schema: opts.schemaName,
        field: '*',
        message: `front type "${typeName}" not found in ${opts.fileName}`,
      },
    ];
  }

  const backend = specProps(schema);
  const front = tsProps(iface);

  for (const [name, sp] of backend) {
    const tp = front.get(name);
    if (!tp) {
      if (sp.required) {
        out.push({
          rule: 'missing-field',
          schema: opts.schemaName,
          field: name,
          message: `backend field "${name}" (${sp.family}) is missing from the front type`,
        });
      }
      continue;
    }
    if (sp.family !== 'unknown' && tp.family !== 'unknown' && sp.family !== tp.family) {
      out.push({
        rule: 'type-family',
        schema: opts.schemaName,
        field: name,
        message: `field "${name}": backend is ${sp.family}, front is ${tp.family}`,
      });
    }
    if (sp.nullable && !tp.nullable) {
      out.push({
        rule: 'nullability',
        schema: opts.schemaName,
        field: name,
        message: `field "${name}": backend allows null, front type does not`,
      });
    }
  }

  for (const name of front.keys()) {
    if (!backend.has(name)) {
      out.push({
        rule: 'orphan-field',
        schema: opts.schemaName,
        field: name,
        message: `front field "${name}" has no counterpart in the backend schema (drift?)`,
      });
    }
  }

  return out;
}
