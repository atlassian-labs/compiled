import React, { StrictMode } from 'react';
import { render } from 'react-dom';
import '@compiled/react';

const App = () => (
  <>
    <div css={{ fontSize: 50, color: 'red' }}>hello from parcel</div>
  </>
);

render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')
);
