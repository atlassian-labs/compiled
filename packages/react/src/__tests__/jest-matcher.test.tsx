/** @jsxImportSource @compiled/react */
// This test belongs in @compiled/jest - but can't be placed there due to a circular dependency.
// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
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
