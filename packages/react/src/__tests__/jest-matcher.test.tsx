/** @jsxImportSource @compiled/react */
// This test belongs in @compiled/jest - but can't be placed there due to a circular dependency.
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap, styled } from '@compiled/react';
import { render } from '@testing-library/react';

describe('toHaveCompliedCss', () => {
  it('should detect styles', () => {
    const { getByText } = render(
      <div
        css={{
          fontSize: '12px',
        }}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should detect styles (SVG)', () => {
    const { getByText } = render(
      <svg
        css={{
          fontSize: '12px',
        }}>
        hello world
      </svg>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should detect missing styles', () => {
    const { getByText } = render(<div css={{ fontSize: '12px' }}>hello world</div>);

    expect(getByText('hello world')).not.toHaveCompiledCss('color', 'blue');
  });

  it('should detect multiple styles', () => {
    const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss({
      fontSize: '12px',
      color: 'blue',
    });
  });

  it('should detect single missing styles', () => {
    const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

    expect(getByText('hello world')).not.toHaveCompiledCss({
      zindex: '9999',
    });
  });

  it('should detect multiple missing styles', () => {
    const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

    expect(getByText('hello world')).not.toHaveCompiledCss({
      backgroundColor: 'yellow',
      zindex: '9999',
    });
  });

  it('should detect evaluated rule from array styles', () => {
    const base = { color: 'blue' };
    const next = ` font-size: 15px; `;

    const { getByText } = render(<div css={[base, next]}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
    expect(getByText('hello world')).toHaveCompiledCss('color', 'blue');
  });

  it('should find styles composed from multiple sources', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const { getByText } = render(<StyledDiv css={{ fontSize: 14 }}>Hello world</StyledDiv>);

    expect(getByText('Hello world')).toHaveCompiledCss('font-size', '14px');
  });

  it('should find multiple styles composed from multiple sources', () => {
    const StyledDiv = styled.div`
      color: yellow;
      background-color: red;
    `;

    const { getByText } = render(<StyledDiv css={{ color: 'blue' }}>Hello world</StyledDiv>);

    expect(getByText('Hello world')).toHaveCompiledCss({
      backgroundColor: 'red',
      color: 'blue',
    });
  });

  it('should match styles with target:hover', () => {
    const { getByText } = render(
      <div
        css={{
          fontSize: '12px',
          ':hover': {
            transform: 'scale(2)',
          },
        }}>
        hello world
      </div>
    );
    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('transform', 'scale(2)', { target: ':hover' });
    expect(el).not.toHaveCompiledCss('transform', 'scale(2)');
  });

  it('should match styles with target', () => {
    const { getByText } = render(
      <div
        css={{
          fontSize: '12px',
          ':hover': {
            transform: 'scale(2)',
          },
          ':active': {
            color: 'blue',
          },
        }}>
        hello world
      </div>
    );
    const el = getByText('hello world');
    expect(el).not.toHaveCompiledCss('color', 'blue', { target: ':hover' });
    expect(el).not.toHaveCompiledCss('transform', 'scale(2)');
    expect(el).not.toHaveCompiledCss('transform', 'scale(2)', { target: ':active' });
    expect(el).toHaveCompiledCss('transform', 'scale(2)', { target: ':hover' });
    expect(el).toHaveCompiledCss('color', 'blue', { target: ':active' });
  });

  it('should match camelCase css vars', () => {
    const styles = cssMap({ root: { '--myCamelVar': 'red' } });

    const { getByText } = render(<div css={styles.root}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('--myCamelVar', 'red');
  });

  it('should match kebab-case css vars', () => {
    const styles = cssMap({ root: { '--my-kebab-var': 'green' } });

    const { getByText } = render(<div css={styles.root}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('--my-kebab-var', 'green');
  });

  it('should match styles with media', () => {
    const { getByText } = render(
      <div
        css={{
          color: 'green',
          '@media screen': {
            color: 'yellow',
          },
        }}>
        hello world
      </div>
    );
    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'green');
    expect(el).toHaveCompiledCss('color', 'yellow', { media: 'screen' });
    // without narrowing to media -> screen
    expect(el).not.toHaveCompiledCss('color', 'yellow');
  });

  it('should match styles with media and target', () => {
    const { getByText } = render(
      <div
        css={{
          color: 'green',
          '@media screen': {
            color: 'yellow',
            ':hover': {
              background: 'red',
            },
          },
        }}>
        hello world
      </div>
    );
    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('background-color', 'red', { media: 'screen', target: ':hover' });
  });

  it('should match styles with media nested inside class', () => {
    const { getByText } = render(
      <div
        css={{
          '@media (min-width: 2px)': {
            color: 'blue',
            '@media (min-width: 1px)': {
              color: 'red',
            },
          },
        }}>
        hello world
      </div>
    );
    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'blue', { media: '(min-width: 2px)' });
    expect(el).toHaveCompiledCss('color', 'red', { media: '(min-width: 1px)' });
  });

  it('should not throw when styles contain modern at-rules', () => {
    const { getByText } = render(
      <div
        css={{
          '@media (min-width: 2px)': {
            color: 'blue',
            '@container (width > 400px)': {
              color: 'red',
            },
          },
          '@starting-style': {
            opacity: 0,
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'blue', { media: '(min-width: 2px)' });
  });

  it('should match styles with container', () => {
    const { getByText } = render(
      <div
        css={{
          color: 'green',
          '@container (width > 400px)': {
            color: 'red',
          },
          '@container sidebar (min-width: 200px)': {
            color: 'pink',
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'green');
    expect(el).toHaveCompiledCss('color', 'red', { container: '(width > 400px)' });
    expect(el).toHaveCompiledCss('color', 'red', { container: '(width>400px)' });
    expect(el).toHaveCompiledCss('color', 'pink', { container: 'sidebar (min-width: 200px)' });
    expect(el).not.toHaveCompiledCss('color', 'pink', { container: '(min-width: 200px)' });
    expect(el).not.toHaveCompiledCss('color', 'red', { container: '(width > 500px)' });
    // without narrowing to the container query
    expect(el).not.toHaveCompiledCss('color', 'red');
    expect(el).not.toHaveCompiledCss('color', 'red', { media: '(width > 400px)' });
  });

  it('should match styles with container and target', () => {
    const { getByText } = render(
      <div
        css={{
          '@container (width > 400px)': {
            ':hover': {
              color: 'red',
            },
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'red', {
      container: '(width > 400px)',
      target: ':hover',
    });
    expect(el).not.toHaveCompiledCss('color', 'red', { container: '(width > 400px)' });
  });

  it('should match styles with container nested inside media', () => {
    const { getByText } = render(
      <div
        css={{
          '@media (min-width: 2px)': {
            color: 'blue',
            '@container (width > 400px)': {
              color: 'red',
            },
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'blue', { media: '(min-width: 2px)' });
    expect(el).toHaveCompiledCss('color', 'red', {
      media: '(min-width: 2px)',
      container: '(width > 400px)',
    });
    // both at-rules have to be named to match
    expect(el).not.toHaveCompiledCss('color', 'red', { media: '(min-width: 2px)' });
    expect(el).not.toHaveCompiledCss('color', 'red', { container: '(width > 400px)' });
    expect(el).not.toHaveCompiledCss('color', 'blue', {
      media: '(min-width: 2px)',
      container: '(width > 400px)',
    });
  });

  it('should match styles with supports', () => {
    const { getByText } = render(
      <div
        css={{
          display: 'block',
          '@supports (display: grid)': {
            display: 'grid',
            '@media (min-width: 2px)': {
              color: 'green',
            },
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('display', 'block');
    expect(el).toHaveCompiledCss('display', 'grid', { supports: '(display: grid)' });
    expect(el).toHaveCompiledCss('color', 'green', {
      supports: '(display: grid)',
      media: '(min-width: 2px)',
    });
    expect(el).not.toHaveCompiledCss('display', 'grid');
    expect(el).not.toHaveCompiledCss('display', 'grid', { supports: '(display: flex)' });
    expect(el).not.toHaveCompiledCss('color', 'green', { media: '(min-width: 2px)' });
  });

  it('should match styles with starting-style', () => {
    const { getByText } = render(
      <div
        css={{
          opacity: 1,
          '@starting-style': {
            opacity: 0,
          },
          '@container (width > 400px)': {
            '@starting-style': {
              transform: 'scale(0.5)',
            },
          },
        }}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('opacity', '1');
    expect(el).toHaveCompiledCss('opacity', '0', { startingStyle: true });
    expect(el).not.toHaveCompiledCss('opacity', '0');
    expect(el).not.toHaveCompiledCss('opacity', '1', { startingStyle: true });
    expect(el).toHaveCompiledCss('transform', 'scale(0.5)', {
      container: '(width > 400px)',
      startingStyle: true,
    });
    expect(el).not.toHaveCompiledCss('transform', 'scale(0.5)', { startingStyle: true });
  });

  it('should match styles with layer', () => {
    const { getByText } = render(
      <div
        css={`
          @layer base {
            color: red;

            @layer reset {
              margin-top: 0;
            }
          }
        `}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'red', { layer: 'base' });
    expect(el).toHaveCompiledCss('margin-top', '0', { layer: 'base.reset' });
    expect(el).not.toHaveCompiledCss('margin-top', '0', { layer: 'reset' });
    expect(el).not.toHaveCompiledCss('color', 'red');
  });

  it('should match complicated direct ancestors', () => {
    const { getByText } = render(
      <div
        css={`
          > :first-child {
            color: red;
          }
        `}>
        hello world
      </div>
    );

    const el = getByText('hello world');
    expect(el).toHaveCompiledCss('color', 'red', { target: '> :first-child' });
  });
});
