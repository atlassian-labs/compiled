/* eslint-disable react/jsx-filename-extension */
import React from 'react';

import { createStrictAPI } from '../';

describe('createStrictAPI()', () => {
  it('should type error when circumventing the excess property check', () => {
    const { css } = createStrictAPI<{
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
    const { css } = createStrictAPI<{
      background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
    }>();

    // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
    css({ background: 'red' });
  });

  it('should mark all properties as optional', () => {
    const { css } = createStrictAPI<{
      background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
      '&:hover': { background: 'var(--ds-surface)' | 'var(--ds-surface-sunken' };
    }>();

    css({});
    css({ '&:hover': {} });
  });

  it('should constrain pseudos', () => {
    const { css } = createStrictAPI<{
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
    const { css, cssMap } = createStrictAPI<{
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
    const { css, cssMap } = createStrictAPI<{
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
    const { cssMap } = createStrictAPI<{
      background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
    }>();

    cssMap({
      primary: {
        // @ts-expect-error — Type '{ val: string; }' is not assignable to type 'Readonly<Properties<string | number, string & {}>> & PseudosDeclarations & EnforceSchema<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>'.
        val: 'ok',
      },
    });
    cssMap({
      primary: {
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

  describe('xcss', () => {
    it('should allow valid values', () => {
      const { XCSSProp } = createStrictAPI<{
        background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
      }>();

      function Button(_: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return null;
      }

      <Button xcss={{ background: 'var(--ds-surface)' }} />;
    });

    it('should type error for invalid values', () => {
      const { XCSSProp } = createStrictAPI<{
        background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
      }>();

      function Button(_: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return null;
      }

      <Button
        xcss={{
          // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | CompiledPropertyDeclarationReference | undefined'.ts(2322)
          background: 'red',
          // @ts-expect-error — Type '{ background: string; }' is not assignable to type 'undefined'.ts(2322)
          '&::after': {
            background: 'red',
          },
        }}
      />;
      <Button
        xcss={{
          // @ts-expect-error — Type '{ asd: number; }' is not assignable to type 'Internal$XCSSProp<"background", never, { background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }, PickObjects<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>, never>'.
          asd: 0,
        }}
      />;
    });

    it('should type error for unsupported pseudos', () => {
      const { XCSSProp } = createStrictAPI<{
        background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
        ':hover': {
          color: 'var(--ds-text)';
        };
      }>();

      function Button(_: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return null;
      }

      <Button
        xcss={{
          // @ts-expect-error — Object literal may only specify known properties, and '':hover'' does not exist in type
          ':hover': {
            color: 'red',
          },
        }}
      />;
      <Button
        xcss={{
          // @ts-expect-error — Object literal may only specify known properties, and '':hover'' does not exist in type
          ':asd': {
            color: 'red',
          },
        }}
      />;
    });

    it('should type error for invalid values in pseudos', () => {
      const { XCSSProp } = createStrictAPI<{
        background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
        '&:hover': {
          color: 'var(--ds-text)';
        };
      }>();

      function Button(_: { xcss: ReturnType<typeof XCSSProp<'color', '&:hover'>> }) {
        return null;
      }

      <Button
        xcss={{
          '&:hover': {
            // @ts-expect-error — Type '"red"' is not assignable to type 'CompiledPropertyDeclarationReference | "var(--ds-text)" | undefined'.ts(2322)
            color: 'red',
          },
        }}
      />;
      <Button
        xcss={{
          '&:hover': {
            // @ts-expect-error — Type '{ asd: string; }' is not assignable to type 'MarkAsRequired<XCSSItem<"color", { color: "var(--ds-text)"; }>, never>'.
            asd: 'red',
          },
        }}
      />;
    });

    it('should enforce required properties', () => {
      const { XCSSProp } = createStrictAPI<{
        background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
      }>();

      function Button(_: {
        xcss: ReturnType<
          typeof XCSSProp<
            'background',
            never,
            { requiredProperties: 'background'; requiredPseudos: never }
          >
        >;
      }) {
        return null;
      }

      // @ts-expect-error — Type '{}' is not assignable to type 'Internal$XCSSProp<"background", never, EnforceSchema<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>, object, { requiredProperties: "background"; requiredPseudos: never; }>'.ts(2322)
      <Button xcss={{}} />;
    });
  });
});
