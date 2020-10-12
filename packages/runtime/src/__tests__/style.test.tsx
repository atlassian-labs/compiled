import React from 'react';
import { render } from '@testing-library/react';
import Style from '../style';

jest.mock('../is-node', () => ({
  isNodeEnvironment: () => false,
}));

describe('<Style />', () => {
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
});
