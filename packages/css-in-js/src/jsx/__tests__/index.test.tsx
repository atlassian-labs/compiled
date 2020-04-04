import '@compiled/css-in-js/jsx';
import React from 'react';
import { render } from '@testing-library/react';

describe('css prop', () => {
  it('should render a simple styled div', () => {
    const { getByText } = render(<div css={{ fontSize: '15px' }}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });
});
