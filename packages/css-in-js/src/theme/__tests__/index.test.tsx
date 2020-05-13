import React from 'react';
import { createThemeProvider } from '@compiled/css-in-js';
import { render } from '@testing-library/react';

const { ThemeProvider } = createThemeProvider<typeof import('@compiled/tokens-test-pkg')>();

describe('create theme provider', () => {
  it('should create a provider component', () => {
    const { getByText } = render(
      <ThemeProvider mode="default">
        {(style) => <div style={style}>hello world</div>}
      </ThemeProvider>
    );

    expect(getByText('hello world').getAttribute('style')).toInclude('--cc-1bya7p6: #0052cc;');
  });

  it('should render dark mode', () => {
    const { getByText } = render(
      <ThemeProvider mode="dark">{(style) => <div style={style}>hello world</div>}</ThemeProvider>
    );

    expect(getByText('hello world').getAttribute('style')).toInclude('--cc-1bya7p6: #4c9aff;');
  });
});
