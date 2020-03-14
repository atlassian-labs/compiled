/**
 * @jest-environment node
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'jest-extended';
import Style from '../style';

describe('<Style />', () => {
  it('should render style as children on the server', () => {
    const result = renderToStaticMarkup(
      <Style hash="a" testId="style">{`.a { display: block; }`}</Style>
    );

    expect(result).toInclude(
      '<style data-compiled="true" data-testid="style">.a { display: block; }</style>'
    );
  });
});
