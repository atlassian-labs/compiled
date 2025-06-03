/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

import type { XCSSProp } from './__fixtures__/strict-api-recursive';
import { css, cssMap } from './__fixtures__/strict-api-recursive';

describe('createStrictAPI()', () => {
  it('should mark all styles as optional in css()', () => {
    const styles = css({
      '&:hover': {},
      '&:active': {},
      '&::before': {},
      '&::after': {},
    });

    const { getByTestId } = render(<div css={styles} data-testid="div" />);

    expect(getByTestId('div')).toBeDefined();
  });

  it('should mark all styles as optional in cssMap()', () => {
    const stylesMap = cssMap({
      nested: {
        '&:hover': {},
        '&:active': {},
        '&::before': {},
        '&::after': {},
      },
    });

    const { getByTestId } = render(<div css={stylesMap.nested} data-testid="div" />);

    expect(getByTestId('div')).toBeDefined();
  });

  it('should mark all styles as optional in xcss prop', () => {
    function Component({
      xcss,
    }: {
      xcss: ReturnType<
        typeof XCSSProp<
          'backgroundColor' | 'color',
          '&:hover' | '&:active' | '&::before' | '&::after'
        >
      >;
    }) {
      return <div data-testid="div" className={xcss} />;
    }

    const { getByTestId } = render(
      <Component
        xcss={{ '&:hover': {}, '&:active': {}, '&::before': {}, '&::after': {} }}
        data-testid="div"
      />
    );

    expect(getByTestId('div')).toBeDefined();
  });

  describe('type violations', () => {
    it('should violate types for css()', () => {
      const styles = css({
        // @ts-expect-error — Type '""' is not assignable to type ...
        color: '',
        // @ts-expect-error — Type '""' is not assignable to type ...
        backgroundColor: '',
        '&:hover': {
          // @ts-expect-error — Type '""' is not assignable to type ...
          color: '',
          // @ts-expect-error — Type '""' is not assignable to type ...
          backgroundColor: '',
          '&::after': {
            // @ts-expect-error — Type '"none"' is not assignable to type ...
            padding: 'none',
          },
        },
        '&:active': {
          // @ts-expect-error — Type '""' is not assignable to type ...
          color: '',
          // @ts-expect-error — Type '""' is not assignable to type ...
          backgroundColor: '',
        },
        '&::before': {
          // @ts-expect-error — Type '""' is not assignable to type ...
          color: '',
          // @ts-expect-error — Type '""' is not assignable to type ...
          backgroundColor: '',
        },
        '&::after': {
          // @ts-expect-error — Type '""' is not assignable to type ...
          color: '',
          // @ts-expect-error — Type '""' is not assignable to type ...
          backgroundColor: '',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toBeDefined();
    });

    it('should violate types for cssMap()', () => {
      const stylesMap = cssMap({
        primary: {
          // @ts-expect-error — Type '""' is not assignable to type ...
          color: '',
          // @ts-expect-error — Type '""' is not assignable to type ...
          backgroundColor: '',
          '&:hover': {
            // @ts-expect-error — Type '""' is not assignable to type ...
            color: '',
            // @ts-expect-error — Type '""' is not assignable to type ...
            backgroundColor: '',
          },
          '&:active': {
            // @ts-expect-error — Type '""' is not assignable to type ...
            color: '',
            // @ts-expect-error — Type '""' is not assignable to type ...
            backgroundColor: '',
          },
          '&::before': {
            // @ts-expect-error — Type '""' is not assignable to type ...
            color: '',
            // @ts-expect-error — Type '""' is not assignable to type ...
            backgroundColor: '',
          },
          '&::after': {
            // @ts-expect-error — Type '""' is not assignable to type ...
            color: '',
            // @ts-expect-error — Type '""' is not assignable to type ...
            backgroundColor: '',
          },
        },
      });

      const { getByTestId } = render(<div css={stylesMap.primary} data-testid="div" />);

      expect(getByTestId('div')).toBeDefined();
    });

    it('should violate types for xcss prop', () => {
      function Component(_: {
        xcss: ReturnType<
          typeof XCSSProp<
            'backgroundColor' | 'color' | 'display',
            '&:hover' | '&:active' | '&::before' | '&::after'
          >
        >;
      }) {
        return <div data-testid="div" />;
      }

      const { getByTestId } = render(
        <div>
          <Component
            // @ts-expect-error — Invalid token
            xcss={{ color: 'var(--ds-color)' }}
          />
          <Component
            // @ts-expect-error — Disallowed property
            xcss={{ padding: '0px' }}
          />
          <Component
            xcss={{
              '&:hover': {
                // @ts-expect-error — Should be a hovered state
                color: 'var(--ds-text)',
                // @ts-expect-error — Should be a hovered state
                backgroundColor: 'var(--ds-success)',
              },
              '&:active': {
                // @ts-expect-error — Should be a hovered state
                color: 'var(--ds-text)',
                // @ts-expect-error — Should be a hovered state
                backgroundColor: 'var(--ds-success)',
              },
            }}
          />
          <Component
            xcss={{
              '&:hover': {
                // @ts-expect-error – Bad nesting
                '&:focus': {
                  display: 'none',
                },
              },
              '&:active': {
                // @ts-expect-error – Bad nesting
                '&:focus': {
                  display: 'none',
                },
              },
            }}
          />
          <Component
            xcss={{
              '&::before': {
                // @ts-expect-error — Type '""' is not assignable to type ...
                color: '',
                // @ts-expect-error — Type '""' is not assignable to type ...
                backgroundColor: '',
              },
              '&::after': {
                // @ts-expect-error — Type '""' is not assignable to type ...
                color: '',
                // @ts-expect-error — Type '""' is not assignable to type ...
                backgroundColor: '',
              },
            }}
          />
          <Component
            xcss={{
              '&:hover': {
                // @ts-expect-error – Bad nesting
                '&:focus': {
                  display: 'none',
                },
              },
              '&:active': {
                // @ts-expect-error — Type '""' is not assignable to type ...
                color: 'var(--ds-text)',
                // @ts-expect-error — Type '""' is not assignable to type ...
                backgroundColor: 'var(--ds-success)',
              },
              '&::before': {
                // @ts-expect-error — Type '""' is not assignable to type ...
                color: '',
                // @ts-expect-error — Type '""' is not assignable to type ...
                backgroundColor: '',
              },
              '&::after': {
                // @ts-expect-error — Type '""' is not assignable to type ...
                color: '',
                // @ts-expect-error — Type '""' is not assignable to type ...
                backgroundColor: '',
              },
            }}
          />
        </div>
      );

      expect(getByTestId('div')).toBeDefined();
    });
  });

  describe('type success', () => {
    it('should pass type check for css()', () => {
      const styles = css({
        // @ts-expect-error — should be a value from the schema
        padding: '10px',
        color: 'var(--ds-text)',
        backgroundColor: 'var(--ds-bold)',
        '&:hover': {
          // @ts-expect-error — should be a value from the schema
          padding: '10px',
          color: 'var(--ds-text-hovered)',
          backgroundColor: 'var(--ds-bold-hovered)',
          '&::after': {
            display: 'block',
            content: '"Hello world"',
            color: 'var(--ds-text)',
            backgroundColor: 'var(--ds-bold)',
          },
        },
        '&:active': {
          // @ts-expect-error — should be a value from the schema
          padding: '10px',
          color: 'var(--ds-text-pressed)',
          backgroundColor: 'var(--ds-bold-pressed)',
        },
        '&::before': {
          // @ts-expect-error — should be a value from the schema
          padding: '10px',
          color: 'var(--ds-text)',
          backgroundColor: 'var(--ds-bold)',
        },
        '&::after': {
          // @ts-expect-error — should be a value from the schema
          padding: '10px',
          color: 'var(--ds-text)',
          backgroundColor: 'var(--ds-bold)',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('color', 'var(--ds-text)');
    });

    it('should pass type check for cssMap()', () => {
      const stylesMap = cssMap({
        primary: {
          color: 'var(--ds-text)',
          backgroundColor: 'var(--ds-bold)',
          // @ts-expect-error — should be a value from the schema
          padding: '10px',
          '&:hover': {
            accentColor: 'red',
            // @ts-expect-error — should be a value from the schema
            padding: '10px',
            color: 'var(--ds-text-hovered)',
            backgroundColor: 'var(--ds-bold-hovered)',
            '&::after': {
              display: 'block',
              content: '"Hello world"',
              color: 'var(--ds-text)',
              backgroundColor: 'var(--ds-bold)',
            },
          },
          '&:active': {
            // @ts-expect-error — should be a value from the schema
            padding: '10px',
            color: 'var(--ds-text-pressed)',
            backgroundColor: 'var(--ds-bold-pressed)',
          },
          '&::before': {
            // @ts-expect-error — should be a value from the schema
            padding: '10px',
            color: 'var(--ds-text)',
            backgroundColor: 'var(--ds-bold)',
          },
          '&::after': {
            // @ts-expect-error — should be a value from the schema
            padding: '10px',
            color: 'var(--ds-text)',
            backgroundColor: 'var(--ds-bold)',
          },
        },
      });

      const stylesMap2 = cssMap({
        primary: {
          '&::after': {
            display: 'block',
            content: '"Hello world"',
            color: 'var(--ds-text)',
            backgroundColor: 'var(--ds-bold)',
            // @ts-expect-error -- Does not allow nested `&::after &:hover`
            '&:hover': {
              color: 'var(--ds-text-hovered)',
            },
          },
        },
      });

      const { getByTestId } = render(
        <div css={[stylesMap.primary, stylesMap2.primary]} data-testid="div" />
      );

      expect(getByTestId('div')).toHaveCompiledCss('color', 'var(--ds-text)');
    });

    it('should pass type check for xcss prop', () => {
      function Component({
        xcss,
      }: {
        xcss: ReturnType<
          typeof XCSSProp<
            'backgroundColor' | 'color',
            '&:hover' | '&:active' | '&::before' | '&::after'
          >
        >;
      }) {
        return <div data-testid="div" className={xcss} />;
      }

      const { getByTestId } = render(
        <Component
          xcss={{
            color: 'var(--ds-text)',
            backgroundColor: 'var(--ds-bold)',
            '&:hover': {
              color: 'var(--ds-text-hovered)',
              backgroundColor: 'var(--ds-bold-hovered)',
              '&::after': {
                color: 'var(--ds-text)',
                backgroundColor: 'var(--ds-bold)',
              },
            },
            '&:active': {
              color: 'var(--ds-text-pressed)',
              backgroundColor: 'var(--ds-bold-pressed)',
            },
            '&::before': {
              color: 'var(--ds-text)',
              backgroundColor: 'var(--ds-bold)',
            },
            '&::after': {
              color: 'var(--ds-text)',
              backgroundColor: 'var(--ds-bold)',
            },
          }}
        />
      );

      expect(getByTestId('div')).toHaveCompiledCss('color', 'var(--ds-text)');
    });
  });
});
