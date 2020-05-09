import React, { useState } from 'react';
import { styled, createThemeProvider } from '@compiled/css-in-js';

export default {
  title: 'theming',
};

const ThemeProvider = createThemeProvider<typeof import('@compiled/tokens-test-pkg')>();

const Thing = styled.div({
  fontSize: '20px',
  color: 'theme(primary)',
});

export const WithThemeProvider = () => {
  const [mode, setMode] = useState(false);

  return (
    <ThemeProvider mode={mode ? 'dark' : 'default'}>
      {(style) => (
        <div style={style}>
          <Thing>Hello world</Thing>
          <button onClick={() => setMode((prev) => !prev)}>Toggle mode</button>
        </div>
      )}
    </ThemeProvider>
  );
};

export const WithoutThemeProvider = () => <Thing>Hello world</Thing>;
