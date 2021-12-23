// eslint-disable-next-line import/no-extraneous-dependencies
import { ClassNames } from '@compiled/react';
import { render } from '@testing-library/react';
import React from 'react';

describe('class names component', () => {
  it('should create css from object literal', () => {
    const { getByText } = render(
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: '13px' })}>hello world</div>}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });

  it('should create css from template literal', () => {
    const { getByText } = render(
      <ClassNames>
        {({ css }) => (
          <div
            className={css`
              font-size: 13px;
            `}>
            hello world
          </div>
        )}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });

  it('should create css from template literal', () => {
    const fontSize = 12;
    const { getByText } = render(
      <ClassNames>
        {({ css, style }) => (
          <div
            style={style}
            className={css`
              font-size: ${fontSize}px;
            `}>
            hello world
          </div>
        )}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should not type error with nested selectors', () => {
    <ClassNames>
      {({ css }) => (
        <div
          className={css({
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
          })}>
          hello world
        </div>
      )}
    </ClassNames>;
  });

  it('should create css from string literal', () => {
    const { getByText } = render(
      <ClassNames>
        {({ css }) => <div className={css('font-size: 13px')}>hello world</div>}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });

  it('should reference an identifier', () => {
    const primary = 'blue';
    const { getByText } = render(
      <ClassNames>
        {({ css, style }) => (
          <div style={style} className={css({ color: primary })}>
            hello world
          </div>
        )}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('color', 'blue');
  });

  it('should create css from array literal', () => {
    const base = { fontSize: 12 };
    const next = `font-size: 13px`;

    const { getByText } = render(
      <ClassNames>{({ css }) => <div className={css([base, next])}>hello world</div>}</ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });

  it('should accept css args', () => {
    const { getByText } = render(
      <ClassNames>
        {({ css }) => (
          <div
            className={css(
              { fontSize: 12 },
              `font-size: 15px;`,
              { color: 'blue', display: 'none' },
              [{ color: 'red' }]
            )}>
            hello world
          </div>
        )}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss({
      fontSize: '15px',
      color: 'red',
      display: 'none',
    });
  });
});
