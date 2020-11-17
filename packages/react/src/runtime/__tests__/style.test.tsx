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

    expect(document.head.innerHTML).toInclude('<style>.b { display: block; }</style>');
  });

  it('should only add one style if it was already added', () => {
    render(<Style>{[`.c { display: block; }`]}</Style>);
    render(<Style>{[`.c { display: block; }`]}</Style>);

    expect(document.head.innerHTML).toIncludeRepeated('<style>.c { display: block; }</style>', 1);
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
          `._a1234567:hover{ color: red; }`,
          `._b1234567:active{ color: blue; }`,
          `._c1234567:link{ color: green; }`,
          `._d1234567{ display: block; }`,
          `@media (max-width: 800px){ ._e1234567{ color: yellow; } }`,
          `._f1234567:focus{ color: pink; }`,
          `._g1234567:visited{ color: grey; }`,
          `._h1234567:focus-visible{ color: white; }`,
          `._i1234567:focus-within{ color: black; }`,
        ]}
      </Style>
    );

    expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style>._d1234567{ display: block; }</style>
      <style>._c1234567:link{ color: green; }</style>
      <style>._g1234567:visited{ color: grey; }</style>
      <style>._i1234567:focus-within{ color: black; }</style>
      <style>._f1234567:focus{ color: pink; }</style>
      <style>._h1234567:focus-visible{ color: white; }</style>
      <style>._a1234567:hover{ color: red; }</style>
      <style>._b1234567:active{ color: blue; }</style>
      <style>@media (max-width: 800px){ ._e1234567{ color: yellow; } }</style>
      "
    `);
  });
});
