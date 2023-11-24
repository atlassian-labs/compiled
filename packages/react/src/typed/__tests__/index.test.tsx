import React from 'react';

import { css, type XCSSProp } from '../index';

declare global {
  interface CompiledTypedProperty {
    color: 'var(--ds-text)';
    backgroundColor: 'var(--ds-surface)';
  }

  interface CompiledTypedPseudo {
    '&:hover': {
      color: 'var(--ds-text-hover)';
      backgroundColor: 'var(--ds-surface-hover)';
    };
  }
}

describe('css()', () => {
  it('should type error for unknown properties', () => {
    css({
      // @ts-expect-error — Object literal may only specify known properties, and asdsd does not exist in type:
      asdsd: 'hey',
      background: 'red',
      backgroundColor: 'var(--ds-surface)',
    });
  });

  it('should type error for property values that do not match schema', () => {
    css({
      background: 'red',
      // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)"'.ts(2322)
      backgroundColor: 'red',
    });
  });

  it('should type error for unknown pseudos', () => {
    css({
      // @ts-expect-error — Object literal may only specify known properties, and ':hover ' does not exist in type:
      ':hover': { color: 'red' },
      background: 'red',
      backgroundColor: 'var(--ds-surface)',
    });
  });
});

describe('xcss prop type', () => {
  it('should type error for unknown properties', () => {
    function Button({}: { xcss: XCSSProp<'backgroundColor', '&:hover'> }) {
      return null;
    }

    <Button
      xcss={{
        // @ts-expect-error — Object literal may only specify known properties, and asdsd does not exist in type:
        asdsd: 'hey',
        backgroundColor: 'var(--ds-surface)',
        '&:hover': {
          backgroundColor: 'var(--ds-surface-hover)',
        },
      }}
    />;
  });

  it.todo('should type error for disallowed property', () => {});

  it.todo('should type error for disallowed pseudo', () => {});

  it('should type error for property values that do not match schema', () => {
    function Button({}: { xcss: XCSSProp<'backgroundColor', '&:hover'> }) {
      return null;
    }

    <Button
      xcss={{
        // @ts-expect-error
        backgroundColor: 'var(--ds-surface-hover)',
        '&:hover': {
          backgroundColor: 'var(--ds-surface-hover)',
        },
      }}
    />;
  });

  it('should type error for unknown pseudos', () => {
    function Button({}: { xcss: XCSSProp<'backgroundColor', '&:hover'> }) {
      return null;
    }

    <Button
      xcss={{
        backgroundColor: 'var(--ds-surface)',
        '&:hover': {
          // @ts-expect-error
          backgroundColor: 'var(--ds-surface)',
        },
      }}
    />;
  });
});
