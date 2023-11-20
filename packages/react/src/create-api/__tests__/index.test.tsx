/* eslint-disable react/jsx-filename-extension */
import { createAPI } from '../';

describe('createAPI()', () => {
  it('should type error when passing in unsupported properties', () => {
    // @ts-expect-error — Type '{ bkgrnd: "red" | "green"; }' has no properties in common with type 'Readonly<Properties<string | number, string & {}>>'.ts(2559)
    createAPI<{
      bkgrnd: 'red' | 'green';
    }>();

    // @ts-expect-error — Type '{ ':hover': {}; }' has no properties in common with type 'Readonly<Properties<string | number, string & {}>>'.ts(2559)
    createAPI<{ ':hover': { backgroundColor: 'red' } }>();
  });

  it('should type error when circumventing the excess property check', () => {
    const { css } = createAPI<{
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken'; bkgrnd: 'red' };
      bkgrnd: 'red' | 'green';
    }>();

    css({
      color: 'red',
      // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
      bkgrnd: 'red',
      '&:hover': {
        color: 'red',
        // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
        bkgrnd: 'red',
      },
    });
  });

  it('should constrain declared types for css() func', () => {
    const { css } = createAPI<{ background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' }>();

    // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
    css({ background: 'red' });
  });

  it('should mark all properties as optional', () => {
    const { css } = createAPI<{
      background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' };
    }>();

    css({});
    css({ '&:hover': {} });
  });

  it('should constrain pseudos', () => {
    const { css } = createAPI<{
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' };
    }>();

    css({
      background: 'red',
      '&:hover': {
        // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
        background: 'red',
      },
    });
  });

  it('should allow valid properties inside pseudos that are different to root', () => {
    const { css } = createAPI<{
      background: 'var(--ds-exclusive)';
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' };
    }>();

    css({
      background: 'var(--ds-exclusive)',
      '&:hover': {
        accentColor: 'red',
        background: 'var(--ds-surface)',
      },
    });
  });

  it('should allow valid properties', () => {
    const { css } = createAPI<{ background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' }>();

    css({ background: 'var(--ds-surface)', accentColor: 'red', all: 'inherit' });
  });

  it.todo('should constrain types for cssMap() func');

  it.todo('should constrain types for XCSSProp type');

  it.todo('should constrain types for ClassNames element');

  it.todo('should constrain types for styled component');

  it.todo('should pass through keyframes');

  it.todo('should expose 1:1 api');
});
