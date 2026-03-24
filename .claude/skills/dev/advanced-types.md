# Advanced TypeScript Patterns

Enterprise-grade type patterns for TypeScript 6 strict mode. Use these when building
`@granit/*` packages and consumer apps.

---

## Generics

### Constraints with `extends`

```typescript
// Single constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// Constraint with interface
type HasId = { readonly id: string };
function findById<T extends HasId>(items: readonly T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
```

### Generic factory pattern

```typescript
type Constructor<T> = new (...args: unknown[]) => T;

function createInstance<T>(ctor: Constructor<T>, ...args: unknown[]): T {
  return new ctor(...args);
}
```

### Generic with default type parameter

```typescript
type ApiResponse<T = unknown> = {
  readonly data: T;
  readonly status: number;
  readonly headers: Record<string, string>;
};
```

---

## Conditional types

### Basic conditional

```typescript
type IsString<T> = T extends string ? true : false;
type A = IsString<string>; // true
type B = IsString<number>; // false
```

### `infer` keyword — extract nested types

```typescript
// Extract return type of a function
type ReturnOf<T> = T extends (...args: unknown[]) => infer R ? R : never;

// Extract element type from array
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;

// Extract Promise resolved type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Extract props type from React component
type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;
```

### Distributive conditional types

```typescript
// Distributes over union members
type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

// Exclude specific types from union
type StringOrNumber = string | number | boolean;
type OnlyStringOrNumber = Exclude<StringOrNumber, boolean>; // string | number
```

---

## Mapped types

### Basic mapped type

```typescript
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Partial<T> = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] };
```

### Key remapping with `as`

```typescript
// Prefix keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};

type User = { name: string; age: number };
type PrefixedUser = Prefixed<User, 'user'>;
// { userName: string; userAge: number }

// Filter keys by value type
type MethodsOf<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? K : never]: T[K];
};

// Remove specific keys
type OmitByPrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${string}` ? never : K]: T[K];
};
```

### Deep mapped types

```typescript
// DeepReadonly — recursively make all properties readonly
type DeepReadonly<T> = T extends primitive
  ? T
  : T extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : { readonly [K in keyof T]: DeepReadonly<T[K]> };

type primitive = string | number | boolean | null | undefined | symbol | bigint;

// DeepPartial — recursively make all properties optional
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
```

---

## Template literal types

### Type-safe string patterns

```typescript
// HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Route parameters
type RouteParam<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? Param | RouteParam<Rest>
  : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = RouteParam<'/api/users/:userId/posts/:postId'>;
// "userId" | "postId"

// Event names
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // "onClick"
```

### Type-safe CSS class builder

```typescript
type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type ButtonClass = `btn-${Variant}` | `btn-${Size}`;
```

---

## Discriminated unions

### State machine pattern

```typescript
type AsyncState<T, E = string> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: E };

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case 'idle':
      return 'Ready';
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Data: ${JSON.stringify(state.data)}`;
    case 'error':
      return `Error: ${state.error}`;
  }
}
```

### Action/event pattern (Redux-style)

```typescript
type Action =
  | { readonly type: 'INCREMENT'; readonly payload: number }
  | { readonly type: 'DECREMENT'; readonly payload: number }
  | { readonly type: 'RESET' };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'INCREMENT':
      return state + action.payload;
    case 'DECREMENT':
      return state - action.payload;
    case 'RESET':
      return 0;
  }
}
```

### Exhaustive check

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

function handle(action: Action) {
  switch (action.type) {
    case 'INCREMENT':
      return;
    case 'DECREMENT':
      return;
    case 'RESET':
      return;
    default:
      assertNever(action); // Compile error if a case is missing
  }
}
```

---

## Branded types

Prevent accidental mixing of structurally identical types:

```typescript
// Define branded types
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type Email = Brand<string, "Email">;

// Constructor functions (runtime validation optional)
function toUserId(id: string): UserId {
  return id as UserId;
}

function toEmail(value: string): Email {
  if (!value.includes("@")) {
    throw new Error(`Invalid email: ${value}`);
  }
  return value as Email;
}

// Type-safe usage — cannot mix
function getUser(id: UserId): Promise<User> { ... }
function getOrder(id: OrderId): Promise<Order> { ... }

const userId = toUserId("u-123");
const orderId = toUserId("o-456") as unknown as OrderId; // Would need explicit cast
getUser(userId);   // OK
getUser(orderId);  // Compile error
```

---

## Type guards and assertion functions

### Type guard (`is`)

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isApiError(error: unknown): error is { code: number; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

// Discriminated union guard
function isSuccess<T>(state: AsyncState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success';
}
```

### Assertion function (`asserts`)

```typescript
function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value == null) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

// Usage — narrows type after call
const user: User | null = getUser();
assertDefined(user, 'User not found');
user.name; // TypeScript knows user is not null here
```

---

## `satisfies` operator

Validates type conformance without widening:

```typescript
// Without satisfies — type widens to Record<string, string | number>
const config = {
  host: 'localhost',
  port: 3000,
} as const;

// With satisfies — retains literal types while checking structure
type Config = Record<string, string | number>;
const config = {
  host: 'localhost',
  port: 3000,
} satisfies Config;
// config.host is "localhost" (not string)
// config.port is 3000 (not number)

// Query key factory (Granit pattern)
const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (p: QueryParams) => [...patientKeys.lists(), p] as const,
  detail: (id: string) => [...patientKeys.all, 'detail', id] as const,
} satisfies Record<string, unknown>;
```

---

## Utility types — common patterns

### Make specific fields required/optional

```typescript
type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Usage
type CreateUser = WithOptional<User, 'id' | 'createdAt'>;
type UpdateUser = WithRequired<Partial<User>, 'id'>;
```

### Strict omit (errors on invalid keys)

```typescript
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
// Unlike built-in Omit, this errors if K is not in T
```

### Record with specific value types

```typescript
// Type-safe dictionary
type Dictionary<T> = Readonly<Record<string, T | undefined>>;

// Enum-keyed record
type PermissionMap = Readonly<Record<Permission, boolean>>;
```

### Path types for nested objects

```typescript
type PathKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${PathKeys<T[K]>}` : K;
    }[keyof T & string]
  : never;

type UserPaths = PathKeys<{
  name: string;
  address: { street: string; city: string };
}>;
// "name" | "address" | "address.street" | "address.city"
```

---

## React-specific patterns

### Polymorphic component (`as` prop)

```typescript
type PolymorphicProps<E extends React.ElementType, P = object> = P &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P> & {
    readonly as?: E;
  };

type TextProps<E extends React.ElementType = "span"> = PolymorphicProps<
  E,
  { readonly variant: "body" | "heading" | "caption" }
>;

function Text<E extends React.ElementType = "span">({
  as,
  variant,
  ...props
}: TextProps<E>) {
  const Component = as ?? "span";
  return <Component {...props} />;
}

// Usage
<Text variant="heading" as="h1">Title</Text>
<Text variant="body">Paragraph</Text>
```

### Generic list component

```typescript
type ListProps<T> = {
  readonly items: readonly T[];
  readonly renderItem: (item: T, index: number) => React.ReactNode;
  readonly keyExtractor: (item: T) => string;
  readonly emptyMessage?: string;
};

function List<T>({ items, renderItem, keyExtractor, emptyMessage }: ListProps<T>) {
  if (items.length === 0) {
    return <p>{emptyMessage ?? "No items"}</p>;
  }
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}
```

### Type-safe context

```typescript
function createSafeContext<T>(displayName: string) {
  const Context = React.createContext<T | null>(null);
  Context.displayName = displayName;

  function useContext(): T {
    const value = React.useContext(Context);
    if (value === null) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return value;
  }

  return [Context.Provider, useContext] as const;
}

// Usage
type AuthContext = { user: User; logout: () => void };
const [AuthProvider, useAuth] = createSafeContext<AuthContext>('Auth');
```

---

## Error handling — Result type

Avoid throwing for expected errors:

```typescript
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
function parseJson<T>(input: string): Result<T, string> {
  try {
    return ok(JSON.parse(input) as T);
  } catch {
    return err('Invalid JSON');
  }
}

const result = parseJson<Config>(raw);
if (result.ok) {
  result.value; // Config
} else {
  result.error; // string
}
```

---

## Builder pattern with compile-time checks

```typescript
type BuilderState = {
  hasHost: boolean;
  hasPort: boolean;
};

type ServerConfig = {
  readonly host: string;
  readonly port: number;
  readonly ssl?: boolean;
};

class ServerBuilder<S extends BuilderState = { hasHost: false; hasPort: false }> {
  private config: Partial<ServerConfig> = {};

  host(value: string): ServerBuilder<S & { hasHost: true }> {
    this.config.host = value;
    return this as unknown as ServerBuilder<S & { hasHost: true }>;
  }

  port(value: number): ServerBuilder<S & { hasPort: true }> {
    this.config.port = value;
    return this as unknown as ServerBuilder<S & { hasPort: true }>;
  }

  ssl(value: boolean): this {
    this.config.ssl = value;
    return this;
  }

  build(this: ServerBuilder<{ hasHost: true; hasPort: true }>): ServerConfig {
    return this.config as ServerConfig;
  }
}

// Usage
new ServerBuilder().host('localhost').port(3000).build(); // OK
new ServerBuilder().host('localhost').build(); // Compile error — missing port
```
