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
 * Brands the framework layers over primitives that OpenAPI can't express
 * (`@granit/types`). The contract is about the *family*, so a branded
 * `ISODateString` or `EntityId<…>` satisfies a `string` schema. Local type
 * aliases (e.g. `type FooId = EntityId<'Foo'>`, string-union enums) are
 * resolved automatically — only cross-package brands need to be listed here.
 */
const BRAND_FAMILY: Record<string, Family> = {
  ISODateString: 'string',
  EntityId: 'string',
  TenantId: 'string',
  UserId: 'string',
  CorrelationId: 'string',
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
type SchemaMap = Record<string, OpenApiSchema>;

function specFamily(
  schema: OpenApiSchema,
  schemas: SchemaMap,
  seen: ReadonlySet<string> = new Set()
): PropShape {
  let nullable = schema.nullable === true;
  let type = schema.type;
  if (Array.isArray(type)) {
    nullable = nullable || type.includes('null');
    type = type.find((t) => t !== 'null');
  }

  // Resolve $ref to the target schema's family (e.g. a ref to a string enum is
  // `string`, not `object`); guard against cycles.
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop() ?? schema.$ref;
    const target = seen.has(name) ? undefined : schemas[name];
    if (!target) return { family: 'object', nullable };
    const resolved = specFamily(target, schemas, new Set([...seen, name]));
    return { family: resolved.family, nullable: nullable || resolved.nullable };
  }

  let family: Family;
  if (schema.enum) family = 'string';
  else if (type === 'string') family = 'string';
  else if (type === 'integer' || type === 'number') family = 'number';
  else if (type === 'boolean') family = 'boolean';
  else if (type === 'array') family = 'array';
  else if (type === 'object') family = 'object';
  else family = 'unknown';

  return { family, nullable };
}

function specProps(
  schema: OpenApiSchema,
  schemas: SchemaMap
): Map<string, PropShape & { required: boolean }> {
  const required = new Set(schema.required ?? []);
  const out = new Map<string, PropShape & { required: boolean }>();
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    out.set(name, { ...specFamily(prop, schemas), required: required.has(name) });
  }
  return out;
}

// --- TypeScript side -------------------------------------------------------

type AliasMap = ReadonlyMap<string, ts.TypeNode>;

function isNullish(node: ts.TypeNode): boolean {
  return (
    node.kind === ts.SyntaxKind.NullKeyword ||
    node.kind === ts.SyntaxKind.UndefinedKeyword ||
    (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword)
  );
}

/**
 * Coarse family of a type node, resolving framework brands and local type
 * aliases (`type FooId = EntityId<'Foo'>`, string-union enums) so a branded
 * string still reads as `string`. `seen` guards against alias cycles.
 */
function familyOf(
  node: ts.TypeNode,
  aliases: AliasMap,
  seen: ReadonlySet<string> = new Set()
): Family {
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
    return familyOf(node.type, aliases, seen);
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
  if (ts.isUnionTypeNode(node)) {
    const base = node.types.find((t) => !isNullish(t));
    return base ? familyOf(base, aliases, seen) : 'unknown';
  }
  if (ts.isIntersectionTypeNode(node)) {
    // Brand pattern `string & { __brand }` — the primitive member wins.
    for (const member of node.types) {
      const fam = familyOf(member, aliases, seen);
      if (fam !== 'object' && fam !== 'unknown') return fam;
    }
    return 'object';
  }
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    if (name === 'Array' || name === 'ReadonlyArray') return 'array';
    const brand = BRAND_FAMILY[name];
    if (brand) return brand;
    const alias = aliases.get(name);
    if (alias && !seen.has(name)) return familyOf(alias, aliases, new Set([...seen, name]));
    return 'object';
  }
  if (ts.isTypeLiteralNode(node)) return 'object';
  return 'unknown';
}

function tsFamily(typeNode: ts.TypeNode, aliases: AliasMap): PropShape {
  if (!ts.isUnionTypeNode(typeNode))
    return { family: familyOf(typeNode, aliases), nullable: false };
  let nullable = false;
  const bases: ts.TypeNode[] = [];
  for (const member of typeNode.types) {
    if (isNullish(member)) nullable = true;
    else bases.push(member);
  }
  const first = bases[0];
  return { family: first ? familyOf(first, aliases) : 'unknown', nullable };
}

interface ParsedSource {
  iface?: ts.InterfaceDeclaration;
  aliases: AliasMap;
}

function parseSource(sourceText: string, fileName: string, typeName: string): ParsedSource {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const aliases = new Map<string, ts.TypeNode>();
  let iface: ts.InterfaceDeclaration | undefined;
  sf.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type);
    else if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) iface = node;
  });
  return { iface, aliases };
}

function tsProps(iface: ts.InterfaceDeclaration, aliases: AliasMap): Map<string, PropShape> {
  const out = new Map<string, PropShape>();
  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const shape = tsFamily(member.type, aliases);
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

  const { iface, aliases } = parseSource(opts.sourceText, opts.fileName, typeName);
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

  const backend = specProps(schema, opts.spec.components?.schemas ?? {});
  const front = tsProps(iface, aliases);

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
