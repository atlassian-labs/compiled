import { render } from '@testing-library/react';
import React from 'react';
import { ClassNames } from '@compiled/css-in-js';

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
});
