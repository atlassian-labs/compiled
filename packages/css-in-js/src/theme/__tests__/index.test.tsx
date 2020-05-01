import React from 'react';
import { createThemeProvider } from '@compiled/css-in-js';
import { render } from '@testing-library/react';

const Provider = createThemeProvider();

describe('create theme provider', () => {
  it('should create a provider component', () => {
    const { getByText } = render(
      <Provider mode="default">{(style) => <div style={style}>hello world</div>}</Provider>
    );

    expect(getByText('hello world').getAttribute('style')).toEqual('--cc-1tivpv1: #0052CC;');
  });

  it('should render dark mode', () => {
    const { getByText } = render(
      <Provider mode="dark">{(style) => <div style={style}>hello world</div>}</Provider>
    );

    expect(getByText('hello world').getAttribute('style')).toEqual('--cc-1tivpv1: #FF5630;');
  });
});
