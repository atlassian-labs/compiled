import BabelComponent from '@compiled/babel-component-fixture';
import '@compiled/react';

const App = () => (
  <>
    <div css={{ fontSize: 50, color: 'red' }}>CSS prop</div>
    <BabelComponent>Babel component</BabelComponent>
  </>
);
