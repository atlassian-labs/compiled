import { styled } from '@compiled/css-in-js';
import { render } from 'react-dom';
import React from 'react';
// import Home from './pages/home';

const StyledHmm = styled.div`
  color: red;
`;

render(<StyledHmm>hello?</StyledHmm>, document.getElementById('app'));
