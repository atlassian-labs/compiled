/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

describe('css prop', () => {
  it('should create css from object literal', () => {
    const { getByText } = render(<div css={{ fontSize: '15px' }}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should use string literal with identifier', () => {
    const fontSize = 12;
    const { getByText } = render(
      <div
        css={`
          font-size: ${fontSize}px;
        `}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from string literal', () => {
    const { getByText } = render(
      <div
        css={`
          font-size: 12px;
        `}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should not type error with nested selectors', () => {
    <div
      css={{
        color: 'currentColor',
        textDecoration: 'none',
        position: 'relative',
        ':before': {
          opacity: 0,
          content: '⚓',
          position: 'absolute',
          left: '-5rem',
          fontSize: '3rem',
        },
        ':hover': {
          ':before': {
            opacity: 1,
          },
        },
      }}>
      hello world
    </div>;
  });

  it('should create css from string', () => {
    const { getByText } = render(<div css="font-size: 12px">hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from object reference', () => {
    const base = { fontSize: 12 };
    const { getByText } = render(<div css={base}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from object reference in templatel literal', () => {
    const base = { fontSize: 12 };
    const { getByText } = render(
      <div
        css={`
          ${base}
        `}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from arrow func in templatel literal', () => {
    const base = () => ({ fontSize: 12 });
    const { getByText } = render(
      <div
        css={`
          ${base()}
        `}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from arrow function', () => {
    const base = () => ({ fontSize: 13 });
    const { getByText } = render(<div css={{ ...base() }}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });

  it('should create css from array', () => {
    const base = { fontSize: 12 };
    const next = ` font-size: 15px; `;
    const { getByText } = render(<div css={[base, next]}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should remove duplicate declarations', () => {
    const { getByText } = render(
      <div
        css={`
          font-size: 12px;
          font-size: 20px;
        `}>
        hello world
      </div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '20px');
    expect(getByText('hello world')).not.toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from object reference with true condition', () => {
    const condition = true;
    const base = { fontSize: 12 };
    const { getByText } = render(<div css={condition && base}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from object reference with false condition', () => {
    const condition = false;
    const base = { fontSize: 12 };
    const { getByText } = render(<div css={condition && base}>hello world</div>);

    expect(getByText('hello world')).not.toHaveCompiledCss('font-size', '12px');
  });

  it('should create css from array of object reference with condition', () => {
    const condition = true;
    const base = { fontSize: 12 };
    const base2 = { fontSize: 20 };
    const { getByText } = render(
      <div css={[condition && base, !condition && base2]}>hello world</div>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });
});
