/** @jsxImportSource @compiled/react */
import React from 'react';

// In TS6, when @compiled/react is used as
// jsxImportSource and CompiledJSX.ElementAttributesProperty is a type alias
// (= JSX.ElementAttributesProperty) rather than an inline interface, the alias becomes
// circular because JSX IS CompiledJSX. TS6 resolves this differently from TS4/5,
// causing LibraryManagedAttributes to receive the class instance type instead of the props.

interface InfiniteScrollSelectProps {
  loadOptions: () => Promise<{ options: unknown[]; hasMore: boolean }>;
  filterableSearch?: boolean;
  defaultOptions?: unknown[];
  className?: string;
}

class InfiniteScrollSelect extends React.Component<InfiniteScrollSelectProps> {
  render() {
    return null;
  }
}

interface IntlConfig {
  locale: string;
  children?: React.ReactNode;
}

class IntlProvider extends React.Component<IntlConfig> {
  render() {
    return this.props.children ?? null;
  }
}

const select = (
  <InfiniteScrollSelect
    loadOptions={() => Promise.resolve({ options: [], hasMore: false })}
    filterableSearch={true}
    defaultOptions={[]}
  />
);

const intl = (
  <IntlProvider locale="en">
    <div>content</div>
  </IntlProvider>
);

void select;
void intl;
