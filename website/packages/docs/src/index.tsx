import { StrictMode } from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import '@compiled/website-ui/global.css';
import { App } from './components/app';

render(
  <StrictMode>
    <BrowserRouter basename="/docs">
      <App />
    </BrowserRouter>
  </StrictMode>,
  document.getElementsByTagName('body')[0]
);
