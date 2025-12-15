import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import LandingPage from './components/landing';
import '@compiled/website-ui/global.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>
);
