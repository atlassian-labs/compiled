/**
 * @jest-environment node
 */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'jest-extended';
import Style from '../style';

describe('<Style />', () => {
  it('should render style as children on the server', () => {
    const result = renderToStaticMarkup(<Style hash="a">{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude('<style>.a { display: block; }</style>');
  });

  it('should render style as children on the server with nonce', () => {
    const result = renderToStaticMarkup(
      <Style hash="a" nonce="1234">
        {[`.a { display: block; }`]}
      </Style>
    );

    expect(result).toInclude('<style nonce="1234">.a { display: block; }</style>');
  });
});
