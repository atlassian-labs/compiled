import { render } from '@testing-library/react';
import React from 'react';
import { ClassNames } from '@compiled/css-in-js';

describe('class names component', () => {
  it('should render a simple styled div', () => {
    const { getByText } = render(
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: '13px' })}>hello world</div>}
      </ClassNames>
    );

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '13px');
  });
});
