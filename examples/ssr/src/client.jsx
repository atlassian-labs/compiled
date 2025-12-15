import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './app';

hydrateRoot(document.getElementById('root'), <App />);

if (module.hot) {
  module.hot.accept();
}
