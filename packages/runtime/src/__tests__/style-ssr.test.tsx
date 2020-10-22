import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Style from '../style';

describe('<Style />', () => {
  it('should render style as children on the server', () => {
    const result = renderToStaticMarkup(<Style>{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude('<style>.a { display: block; }</style>');
  });

  it('should render style as children on the server with nonce', () => {
    const result = renderToStaticMarkup(<Style nonce="1234">{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude('<style nonce="1234">.a { display: block; }</style>');
  });

  it('should render style as children on the server in buckets', () => {
    const result = renderToStaticMarkup(
      <Style>
        {[
          `._a1234567:hover{ color: red; }`,
          `._b1234567:active{ color: blue; }`,
          `._c1234567{ display: block; }`,
          `._d1234567:link{ color: green; }`,
          `@media (max-width: 800px){ ._e1234567{ color: yellow; } }`,
          `._f1234567:focus{ color: pink; }`,
          `._g1234567:visited{ color: grey; }`,
          `._h1234567:focus-visible{ color: white; }`,
          `._i1234567:focus-within{ color: black; }`,
        ]}
      </Style>
    );

    expect(result.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style>._c1234567{ display: block; }</style>
      <style data-c=\\"l\\">._d1234567:link{ color: green; }</style>
      <style data-c=\\"v\\">._g1234567:visited{ color: grey; }</style>
      <style data-c=\\"fw\\">._i1234567:focus-within{ color: black; }</style>
      <style data-c=\\"f\\">._f1234567:focus{ color: pink; }</style>
      <style data-c=\\"fv\\">._h1234567:focus-visible{ color: white; }</style>
      <style data-c=\\"h\\">._a1234567:hover{ color: red; }</style>
      <style data-c=\\"a\\">._b1234567:active{ color: blue; }</style>
      <style data-c=\\"m\\">@media (max-width: 800px){ ._e1234567{ color: yellow; } }</style>
      "
    `);
  });
});
