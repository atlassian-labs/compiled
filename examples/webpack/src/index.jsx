import { StrictMode } from 'react';
import { render } from 'react-dom';

import { App } from './app';

import './styles.css';

function createRoot() {
  const element = document.createElement('div');
  element.id = 'root';
  document.body.appendChild(element);
  return element;
}

render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root') || createRoot()
);

if (module.hot) {
  module.hot.accept();
}
