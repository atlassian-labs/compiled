/** @jsxImportSource @compiled/react */
import { expectTypeOf } from 'expect-type';
import React from 'react';

import type { CompiledJSX } from '../jsx-local-namespace';

type ManagedProps<C, P> = CompiledJSX.LibraryManagedAttributes<C, P>;

it('passes component props through LibraryManagedAttributes', () => {
  type Props = { id: string; count: number };
  type Managed = ManagedProps<React.FC<Props>, Props>;

  expectTypeOf<Managed>().toMatchTypeOf<{ id: string; count: number }>();
});

it('always includes an optional key prop', () => {
  type Props = { id: string };
  type Managed = ManagedProps<React.FC<Props>, Props>;

  expectTypeOf<Managed>().toMatchTypeOf<{ key?: React.Key }>();
});

it('adds css prop when className is declared', () => {
  type Props = { className?: string; children?: React.ReactNode };
  type Managed = ManagedProps<React.FC<Props>, Props>;

  expectTypeOf<Managed>().toMatchTypeOf<{ css?: unknown }>();
});

it('does not add css prop when className is absent', () => {
  type Props = { id: string };
  type Managed = ManagedProps<React.FC<Props>, Props>;

  type HasCss = 'css' extends keyof Managed ? true : false;
  expectTypeOf<HasCss>().toEqualTypeOf<false>();
});

it('custom components accept children via JSX children syntax (ElementChildrenAttribute)', () => {
  // ElementChildrenAttribute = { children: {} } tells TypeScript which key is used for JSX children.
  // If this is broken, passing children to custom components fails even when children is in props.
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }

  const el = <Wrapper>hello</Wrapper>;
  const nested = <Wrapper><span>nested</span></Wrapper>;
  void el;
  void nested;
});

it('intrinsic elements accept children', () => {
  // ElementChildrenAttribute = { children: {} } must be correctly defined so that
  // JSX children syntax works for both intrinsic and custom elements.
  const el = <div>content</div>;
  const nested = <div><span>nested</span></div>;
  void el;
  void nested;
});

it('accepts css prop on intrinsic elements', () => {
  const el = <div css={{ fontSize: '12px' }} />;
  void el;
});

it('accepts css prop on components that accept className', () => {
  function Card({ className }: { className?: string }) {
    return <div className={className} />;
  }

  const el = <Card css={{ color: 'red' }} />;
  void el;
});

it('rejects css prop on components without className', () => {
  function NoClassName({ id }: { id: string }) {
    return <div id={id} />;
  }

  const el = (
    <NoClassName
      id="x"
      // @ts-expect-error css is not allowed when className is not declared
      css={{ color: 'red' }}
    />
  );
  void el;
});

it('accepts key prop in JSX', () => {
  const items = ['a', 'b'];
  const els = items.map((item) => <div key={item}>{item}</div>);
  void els;
});

it('preserves inferred prop types for forwardRef components', () => {
  const Input = React.forwardRef<HTMLInputElement, { value: string; className?: string }>(
    ({ value, className }, ref) => <input ref={ref} value={value} className={className} readOnly />
  );

  type Managed = ManagedProps<typeof Input, { value: string; className?: string }>;

  expectTypeOf<Managed>().toMatchTypeOf<{ value: string }>();
  expectTypeOf<Managed>().toMatchTypeOf<{ css?: unknown }>();
});

it('preserves optional props with default values', () => {
  function Badge({ label, count = 0 }: { label: string; count?: number; className?: string }) {
    return <span className={label}>{count}</span>;
  }

  type Managed = ManagedProps<typeof Badge, { label: string; count?: number; className?: string }>;

  expectTypeOf<Managed>().toMatchTypeOf<{ label: string; count?: number }>();
  expectTypeOf<Managed>().toMatchTypeOf<{ css?: unknown }>();
});

it('handles render prop pattern — css on outer component requires className', () => {
  type FieldProps = {
    name: string;
    defaultValue: string;
    label: string;
    isRequired?: boolean;
    children: (bag: { fieldProps: { className?: string }; error?: string }) => React.ReactNode;
  };

  function Field({ children, name }: FieldProps) {
    return <div>{children({ fieldProps: { className: name }, error: undefined })}</div>;
  }

  // Field does not declare className, so css prop should not be allowed on it
  type Managed = ManagedProps<typeof Field, FieldProps>;
  type HasCss = 'css' extends keyof Managed ? true : false;
  expectTypeOf<HasCss>().toEqualTypeOf<false>();

  // Elements inside the render prop are intrinsic elements so css is always allowed
  const el = (
    <Field name="name" defaultValue="" label="Name" isRequired>
      {({ fieldProps, error }) => (
        <input {...fieldProps} css={{ color: error ? 'red' : 'black' }} />
      )}
    </Field>
  );
  void el;
});

it('handles render prop pattern — css on outer component when className is declared', () => {
  type FieldProps = {
    name: string;
    className?: string;
    children: (bag: { fieldProps: { className?: string }; error?: string }) => React.ReactNode;
  };

  function Field({ children, className }: FieldProps) {
    return <div className={className}>{children({ fieldProps: {}, error: undefined })}</div>;
  }

  type Managed = ManagedProps<typeof Field, FieldProps>;
  expectTypeOf<Managed>().toMatchTypeOf<{ css?: unknown }>();
});

it('correctly infers types for generic child components', () => {
  function List<T extends { id: string }>({
    items,
    className,
  }: {
    items: T[];
    className?: string;
  }) {
    return (
      <ul className={className}>
        {items.map((item) => (
          <li key={item.id}>{item.id}</li>
        ))}
      </ul>
    );
  }

  type Props = { items: { id: string }[]; className?: string };
  type Managed = ManagedProps<typeof List, Props>;

  expectTypeOf<Managed>().toMatchTypeOf<{ items: { id: string }[] }>();
  expectTypeOf<Managed>().toMatchTypeOf<{ css?: unknown }>();
});


