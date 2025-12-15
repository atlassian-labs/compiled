import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@compiled/website-ui/global.css';
import { App } from './components/app';

createRoot(document.getElementsByTagName('body')[0]).render(
  <StrictMode>
    <BrowserRouter basename="/docs">
      <App />
    </BrowserRouter>
  </StrictMode>
);
