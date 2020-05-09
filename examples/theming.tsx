import React, { useState } from 'react';
import { styled, ClassNames, createThemeProvider } from '@compiled/css-in-js';

export default {
  title: 'theming',
};

const { ThemeProvider, theme } = createThemeProvider<typeof import('@compiled/tokens-test-pkg')>();

const Thing = styled.div({
  fontSize: '20px',
  color: theme.primary,
});

const ThingCssProp = (props: { children: React.ReactNode }) => (
  <div
    css={{
      fontSize: 20,
      color: theme.primary,
    }}>
    {props.children}
  </div>
);

const ThingClassNames = (props: { children: React.ReactNode }) => (
  <ClassNames>
    {({ css, style }) => (
      <div
        style={style}
        className={css({
          fontSize: 20,
          color: theme.primary,
        })}
        {...props}
      />
    )}
  </ClassNames>
);

export const WithThemeProvider = () => {
  const [mode, setMode] = useState(false);

  return (
    <ThemeProvider mode={mode ? 'dark' : 'default'}>
      {(style) => (
        <div style={style}>
          <Thing>Hello styled</Thing>
          <ThingCssProp>Hello css prop</ThingCssProp>
          <ThingClassNames>Hello class names</ThingClassNames>
          <button onClick={() => setMode((prev) => !prev)}>Toggle mode</button>
        </div>
      )}
    </ThemeProvider>
  );
};

export const WithoutThemeProvider = () => (
  <>
    <Thing>Hello styled</Thing>
    <ThingCssProp>Hello css prop</ThingCssProp>
    <ThingClassNames>Hello class names</ThingClassNames>
  </>
);
