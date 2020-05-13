import React, { useState } from 'react';
import { styled, ClassNames, createThemeProvider } from '@compiled/css-in-js';

export default {
  title: 'theming',
};

const { ThemeProvider, theme } = createThemeProvider<typeof import('@compiled/tokens-test-pkg')>();

const PrimaryButton = styled.button({
  fontSize: theme.fontSize,
  backgroundColor: theme.colors.primary,
  color: theme.colors.color,
  borderRadius: theme.borderRadius,
  border: 0,
  padding: '4px 8px',
});

const Card = (props: { children: React.ReactNode }) => (
  <div
    css={{
      margin: 16,
      fontSize: theme.fontSize,
      backgroundColor: theme.colors.card.background,
      boxShadow: theme.elevation.e400,
      borderRadius: theme.borderRadius,
    }}>
    {props.children}
  </div>
);

const Hr = () => (
  <ClassNames>
    {({ css }) => (
      <hr
        className={css({
          height: 2,
          margin: 0,
          border: 0,
          backgroundColor: theme.colors.divider,
        })}
      />
    )}
  </ClassNames>
);

const Container = styled.div`
  padding: 16px;
`;

export const WithThemeProvider = () => {
  const [mode, setMode] = useState(false);

  return (
    <ThemeProvider mode={mode ? 'dark' : 'default'}>
      {(style) => (
        <div style={style}>
          <Card>
            <Container>
              <p>Hello world</p>
            </Container>
            <Hr />
            <Container>
              <PrimaryButton onClick={() => setMode((prev) => !prev)}>
                Switch to {mode ? 'default' : 'dark'}
              </PrimaryButton>
            </Container>
          </Card>
        </div>
      )}
    </ThemeProvider>
  );
};

export const WithoutThemeProvider = () => (
  <>
    <Card>
      <p>Hello world</p>
      <Hr />
      <PrimaryButton>Default</PrimaryButton>
    </Card>
  </>
);
