/** @jsxImportSource @compiled/react */
import { css, cssMap, keyframes, styled } from '@compiled/react';

const primary = '#6554C0';

const Title = styled.h1({
  fontSize: '48px',
  fontWeight: 'bold',
  color: primary,
  marginBottom: '24px',
});

const Container = styled.div({
  padding: '40px',
  maxWidth: '800px',
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

const Card = styled.div({
  backgroundColor: '#f4f5f7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
});

const buttonStyles = css({
  backgroundColor: primary,
  color: 'white',
  padding: '12px 24px',
  borderRadius: '4px',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer',
  fontWeight: '500',
  ':hover': {
    backgroundColor: '#5243AA',
  },
});

// Test keyframes API
const fadeIn = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(10px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

const AnimatedCard = styled.div({
  animation: `${fadeIn} 0.5s ease-out`,
});

// Test cssMap API
const variantStyles = cssMap({
  primary: {
    backgroundColor: primary,
    color: 'white',
  },
  secondary: {
    backgroundColor: '#f4f5f7',
    color: '#42526E',
  },
  success: {
    backgroundColor: '#00875A',
    color: 'white',
  },
});

export const App = (): JSX.Element => {
  return (
    <Container>
      <Title>Hello from Vite + Compiled!</Title>

      <Card>
        <h2 css={css({ color: '#42526E', marginTop: 0 })}>Welcome</h2>
        <p css={css({ lineHeight: 1.6, color: '#6B778C' })}>
          This is a Vite application using Compiled CSS-in-JS for styling. All styles are
          transformed at build time to atomic CSS.
        </p>
      </Card>

      <AnimatedCard>
        <h2 css={css({ color: '#42526E', marginTop: 0 })}>Features (with keyframes animation)</h2>
        <ul css={css({ lineHeight: 2, color: '#6B778C' })}>
          <li>Zero-runtime CSS-in-JS</li>
          <li>Atomic CSS generation</li>
          <li>TypeScript support</li>
          <li>Hot Module Replacement (HMR)</li>
          <li>✅ css API</li>
          <li>✅ styled API</li>
          <li>✅ cssMap API</li>
          <li>✅ keyframes API</li>
        </ul>
      </AnimatedCard>

      <div css={css({ display: 'flex', gap: '12px', marginTop: '20px' })}>
        <button css={[buttonStyles, variantStyles.primary]}>Primary (cssMap)</button>
        <button css={[buttonStyles, variantStyles.secondary]}>Secondary (cssMap)</button>
        <button css={[buttonStyles, variantStyles.success]}>Success (cssMap)</button>
      </div>
    </Container>
  );
};
