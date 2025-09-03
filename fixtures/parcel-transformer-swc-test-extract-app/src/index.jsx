import BabelComponentExtracted from '@compiled/babel-component-extracted-fixture/dist/index';
import BabelComponent from '@compiled/babel-component-fixture';
import { css } from '@compiled/react';

const App = () => (
  <>
    <div css={css({ fontSize: 50, color: 'blue' })}>CSS prop</div>
    <BabelComponent>Babel component</BabelComponent>
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
  </>
);
