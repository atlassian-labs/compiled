/* eslint-disable react/jsx-filename-extension */
import { createAPI } from '../';

describe('createAPI()', () => {
  it('should type error when circumventing the excess property check', () => {
    const { css } = createAPI<{
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' };
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
    const { css, cssMap } = createAPI<{
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

    cssMap({
      primary: {
        background: 'var(--ds-exclusive)',
        '&:hover': {
          accentColor: 'red',
          background: 'var(--ds-surface)',
        },
      },
    });
  });

  it('should allow valid properties', () => {
    const { css, cssMap } = createAPI<{
      background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
    }>();

    css({
      background: 'var(--ds-surface)',
      accentColor: 'red',
      all: 'inherit',
      '&:hover': { color: 'red' },
      '&:invalid': { color: 'orange' },
    });
    cssMap({
      primary: {
        background: 'var(--ds-surface)',
        accentColor: 'red',
        all: 'inherit',
        '&:hover': { color: 'red' },
        '&:invalid': { color: 'orange' },
      },
    });
  });

  it('should constrain types for cssMap() func', () => {
    const { cssMap } = createAPI<{ background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' }>();

    cssMap({
      primary: {
        // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // This should be an error but it's not. The inner nested one is however! What!?
        // @ts-expect-please-error — Type 'string' is not assignable to type 'never'.ts(2322)
        val: 'ok',
        // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
        background: 'red',
        '&:hover': {
          // @ts-expect-error — Type 'string' is not assignable to type 'never'.ts(2322)
          val: 'ok',
          background: 'red',
        },
      },
    });
  });
});
