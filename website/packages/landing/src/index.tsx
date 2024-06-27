import { StrictMode } from 'react';
import { render } from 'react-dom';

import LandingPage from './components/landing';
import '@compiled/website-ui/global.css';

render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
  document.getElementById('app')
);
