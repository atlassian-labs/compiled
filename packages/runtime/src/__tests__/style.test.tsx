import React from 'react';
import { render } from '@testing-library/react';
import Style from '../style';

jest.mock('../is-node', () => ({
  isNodeEnvironment: () => false,
}));

describe('<Style />', () => {
  beforeEach(() => {
    // Reset style tags in head before each test so that it will remove styles
    // injected by test
    document.head.querySelectorAll('style').forEach((styleElement) => {
      styleElement.textContent = '';
    });
  });

  it('should render nothing on the client', () => {
    const { baseElement } = render(<Style>{[`.a { display: block; }`]}</Style>);

    expect(baseElement.getElementsByTagName('style')).toHaveLength(0);
  });

  it('should add style to the head on the client', () => {
    render(<Style>{[`.b { display: block; }`]}</Style>);

    expect(document.head.innerHTML).toInclude(
      '<style data-compiled-style="">.b { display: block; }</style>'
    );
  });

  it('should only add one style if it was already added', () => {
    render(<Style>{[`.c { display: block; }`]}</Style>);
    render(<Style>{[`.c { display: block; }`]}</Style>);

    expect(document.head.innerHTML).toIncludeRepeated(
      '<style data-compiled-style="">.c { display: block; }</style>',
      1
    );
  });

  it('should noop in prod', () => {
    jest.spyOn(console, 'error');
    process.env.NODE_ENV = 'production';

    render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('should warn in dev when using a dangerous pseduo selector', () => {
    jest.spyOn(console, 'error');
    process.env.NODE_ENV = 'development';

    render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

    expect(console.error).toHaveBeenCalled();
  });

  it('should warn in dev only once', () => {
    jest.spyOn(console, 'error');
    process.env.NODE_ENV = 'development';

    render(<Style>{[`.c:first-child { display: block; }`]}</Style>);
    render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should render style tags in buckets', () => {
    render(
      <Style>
        {[
          `.a:hover { color: red; }`,
          `.b:active { color: blue; }`,
          `.c:link { color: green; }`,
          `.d { display: block; }`,
          `@media (max-width: 800px) { .e { color: yellow; } }`,
          `.f:focus { color: pink; }`,
          `.g:visited { color: grey; }`,
          `.h:focus-visible { color: white; }`,
          `.i:focus-within { color: black; }`,
        ]}
      </Style>
    );

    expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style data-compiled-style=\\"\\">.d { display: block; }</style>
      <style data-compiled-link=\\"\\">.c:link { color: green; }</style>
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
