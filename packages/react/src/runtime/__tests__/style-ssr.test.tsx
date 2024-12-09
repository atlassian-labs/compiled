/**
 * @jest-environment node
 */

import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';

import Style from '../style';

describe('<Style />', () => {
  it('should render style as children on the server', () => {
    const result = renderToStaticMarkup(<Style>{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude('<style data-cmpld="true">.a { display: block; }</style>');
  });

  it('should render style as children on the server with nonce', () => {
    const result = renderToStaticMarkup(<Style nonce="1234">{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude(
      '<style data-cmpld="true" nonce="1234">.a { display: block; }</style>'
    );
  });

  it('should not output html comments', () => {
    const result = renderToString(
      <Style>{[`._a1234567:hover{ color: red; }`, `._b1234567:active{ color: blue; }`]}</Style>
    );

    expect(result).not.toContain('<!--');
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
          `._j1234567{ border: none; }`,
          `._j1234567{ border-top: 1px solid transparent; }`,
          `._j1234567{ border-top-color: red; }`,
          `._j1234567:focus{ border-top-color: transparent; }`,
          `._j1234567:focus{ border-color: blue; }`,
          `._j1234567:focus{ border: 1px solid; }`,
        ]}
      </Style>
    );

    // WARNING: This is wrong, the `focus` border properties are different than without focus, borders would be indeterministic.
    expect(result.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style data-cmpld="true">._j1234567{ border: none; }._j1234567{ border-top: 1px solid transparent; }._c1234567{ display: block; }._j1234567{ border-top-color: red; }._d1234567:link{ color: green; }._g1234567:visited{ color: grey; }._i1234567:focus-within{ color: black; }._f1234567:focus{ color: pink; }._j1234567:focus{ border-top-color: transparent; }._j1234567:focus{ border-color: blue; }._j1234567:focus{ border: 1px solid; }._h1234567:focus-visible{ color: white; }._a1234567:hover{ color: red; }._b1234567:active{ color: blue; }@media (max-width: 800px){ ._e1234567{ color: yellow; } }</style>
      "
    `);
  });
});
