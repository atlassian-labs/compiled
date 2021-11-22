import React from 'react';

import BabelCJS from './lib/babel-cjs';
import BabelESM from './lib/babel-esm';

export const App = (): JSX.Element => (
  <>
    <BabelCJS />
    <BabelESM />
  </>
);
