import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Style from '../style';

describe('<Style />', () => {
  it('should render style as children on the server', () => {
    const result = renderToStaticMarkup(<Style>{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude('<style data-compiled-style="">.a { display: block; }</style>');
  });

  it('should render style as children on the server with nonce', () => {
    const result = renderToStaticMarkup(<Style nonce="1234">{[`.a { display: block; }`]}</Style>);

    expect(result).toInclude(
      '<style data-compiled-style="" nonce="1234">.a { display: block; }</style>'
    );
  });

  it('should render style as children on the server in buckets', () => {
    const result = renderToStaticMarkup(
      <Style>
        {[
          `.a:hover { color: red; }`,
          `.b:active { color: blue; }`,
          `.c { display: block; }`,
          `.d:link { color: green; }`,
          `@media (max-width: 800px) { .e { color: yellow; } }`,
          `.f:focus { color: pink; }`,
          `.g:visited { color: grey; }`,
          `.h:focus-visible { color: white; }`,
          `.i:focus-within { color: black; }`,
        ]}
      </Style>
    );

    expect(result.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style data-compiled-style=\\"\\">.c { display: block; }</style>
      <style data-compiled-link=\\"\\">.d:link { color: green; }</style>
      <style data-compiled-visited=\\"\\">.g:visited { color: grey; }</style>
      <style data-compiled-focus-within=\\"\\">.i:focus-within { color: black; }</style>
      <style data-compiled-focus=\\"\\">.f:focus { color: pink; }</style>
      <style data-compiled-focus-visible=\\"\\">.h:focus-visible { color: white; }</style>
      <style data-compiled-hover=\\"\\">.a:hover { color: red; }</style>
      <style data-compiled-active=\\"\\">.b:active { color: blue; }</style>
      <style data-compiled-media=\\"\\">@media (max-width: 800px) { .e { color: yellow; } }</style>
      "
    `);
  });
});
