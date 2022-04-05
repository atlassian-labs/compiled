/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
import { render } from '@testing-library/react';

const em = (str: string | number) => str;

describe('styled component', () => {
  it('should render a simple styled div using an object', () => {
    const StyledDiv = styled.div({
      fontSize: '12px',
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should render a simple styled div using a template literal', () => {
    const StyledDiv = styled.div`
      font-size: 30px;
    `;

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '30px');
  });

  it('should interpolate a simple number value', () => {
    const size = '12px';
    const StyledDiv = styled.div<{ fontSize: string }>`
      font-size: ${(props) => props.fontSize};
    `;

    const { getByText } = render(<StyledDiv fontSize={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should at runtime use a call expression inline', () => {
    const size = 12;
    const StyledDiv = styled.div({
      fontSize: em(size),
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should at runtime use a identifier referencing a call expression', () => {
    const size = em(12);
    const StyledDiv = styled.div({
      fontSize: size,
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should not pass down invalid html attributes to the node', () => {
    const size = '12px';
    const StyledDiv = styled.div<{ fonty: string }>`
      font-size: ${(props) => props.fonty};
    `;

    const { getByText } = render(<StyledDiv fonty={size}>hello world</StyledDiv>);

    expect(getByText('hello world').getAttribute('fonty')).toBe(null);
  });

  it('should automatically add suffix on template literal', () => {
    const size = 12;
    const StyledDiv = styled.div<{ size: number }>`
      height: ${(props) => props.size}px;
      width: ${(props) => props.size}px;
    `;

    const { getByText } = render(<StyledDiv size={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss({
      height: '12px',
      width: '12px',
    });
  });

  it('should automatically add suffix on css object', () => {
    const size = 12;
    const StyledDiv = styled.div<{ size: number }>({
      height: (props) => `${props.size}px`,
      width: (props) => `${props.size}px`,
    });

    const { getByText } = render(<StyledDiv size={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss({
      height: '12px',
      width: '12px',
    });
  });

  it('should allow passing down native attributes', () => {
    const Link = styled.a``;

    const { getByText } = render(<Link href="#">hello world</Link>);

    expect(getByText('hello world').getAttribute('href')).toEqual('#');
  });

  it('should not type error with nested selectors', () => {
    expect(() => {
      styled.div({
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
      });
    }).not.toThrow();
  });

  it('should not have a display name', () => {
    process.env.NODE_ENV = 'production';

    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    expect(StyledDiv.displayName).toEqual(undefined);
  });

  it('should have a display name', () => {
    process.env.NODE_ENV = 'development';

    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    expect(StyledDiv.displayName).toEqual('StyledDiv');
  });

  it('should not type error with nested arrow funcs', () => {
    expect(() => {
      styled.div<{ fontSize: string }>({
        color: 'currentColor',
        textDecoration: 'none',
        position: 'relative',
        fontSize: (props) => props.fontSize,
        ':before': {
          fontSize: (props) => props.fontSize,
          opacity: 0,
          content: '⚓',
          position: 'absolute',
          left: '-5rem',
        },
        ':hover': {
          fontSize: (props) => props.fontSize,
          ':before': {
            fontSize: (props) => props.fontSize,
            opacity: 1,
          },
        },
      });
    }).not.toThrow();
  });

  it('should forward ref', () => {
    let ref: HTMLAnchorElement | null = null;
    const Link = styled.a``;

    render(
      <Link ref={(r) => (ref = r)} href="#">
        hello world
      </Link>
    );

    expect(ref).toHaveProperty('tagName', 'A');
  });

  it('should override the underlying markup with a span', () => {
    const Heading = styled.h1`
      color: red;
    `;

    const { getByText } = render(<Heading as="span">Hello world</Heading>);

    expect(getByText('Hello world').tagName).toEqual('SPAN');
  });

  it('should compose a component using template literal', () => {
    const Div = (props: Record<string, unknown>) => <div {...props} />;
    const StyledDiv = styled(Div)`
      font-size: 12px;
    `;

    const { getByText } = render(<StyledDiv>Hello world</StyledDiv>);

    expect(getByText('Hello world').tagName).toEqual('DIV');
  });

  it('should override css prop styles', () => {
    const Child = (props: { children: any; className?: string }) => (
      <h1 {...props} className={props.className} css={{ fontSize: 10 }} />
    );
    const Override = styled(Child)`
      font-size: 12px;
    `;

    const { getByText } = render(<Override>Hello world</Override>);

    expect(getByText('Hello world')).toHaveCompiledCss({
      fontSize: '12px',
    });
  });

  it('should compose a component using object literal', () => {
    const Div = (props: Record<string, unknown>) => <div {...props} />;
    const StyledDiv = styled(Div)({
      fontSize: 12,
    });

    const { getByText } = render(<StyledDiv>Hello world</StyledDiv>);

    expect(getByText('Hello world').tagName).toEqual('DIV');
  });

  it('should inherit types from composed component', () => {
    const Link = (props: { href: string }) => <a {...props} />;
    const StyledLink = styled(Link)({
      fontSize: 12,
    });

    const { getByText } = render(<StyledLink href="/world">Hello world</StyledLink>);

    expect(getByText('Hello world').getAttribute('href')).toEqual('/world');
  });

  it('should compose from array', () => {
    const extra = {
      color: 'blue',
    };
    const StyledLink = styled.div([
      {
        fontSize: 12,
      },
      extra,
    ]);

    const { getByText } = render(<StyledLink>Hello world</StyledLink>);

    expect(getByText('Hello world')).toHaveCompiledCss({
      color: 'blue',
      'font-size': '12px',
    });
  });

  it('should not type error', () => {
    expect(() => {
      styled.div<{ primary: string }>({
        fontSize: '20px',
        color: (props) => props.primary,
        margin: '20px',
        ':hover': {
          color: 'red',
        },
      });
    }).not.toThrow();
  });

  it('should create css from string', () => {
    const StyledDiv = styled.div('font-size: 15px;');

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should create css from template literal', () => {
    const StyledDiv = styled.div(`font-size: 15px;`);

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should create css from array', () => {
    const base = { fontSize: 12 };
    const next = ` font-size: 15px; `;
    const StyledDiv = styled.div([base, next]);

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should accept css args', () => {
    const StyledDiv = styled.div(
      { fontSize: 12 },
      `font-size: 15px;`,
      { color: 'blue', display: 'none' },
      [{ color: 'red' }]
    );

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss({
      fontSize: '15px',
      color: 'red',
      display: 'none',
    });
  });
});
