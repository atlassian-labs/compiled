import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

import './styles.css';

function createRootElement() {
  const element = document.createElement('div');
  element.id = 'root';
  document.body.appendChild(element);
  return element;
}

createRoot(document.getElementById('root') || createRootElement()).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (module.hot) {
  module.hot.accept();
}
