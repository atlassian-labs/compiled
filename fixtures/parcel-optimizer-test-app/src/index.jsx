// eslint-disable-next-line import/named -- cssMapScoped is not in public types
import { styled, cssMapScoped } from '@compiled/react';
import * as React from 'react';

const ComponentA = styled.div({
  color: 'red',
  ':hover': {
    color: 'green',
  },
  ':focus': {
    color: 'orange',
  },
});

const ComponentB = styled.div({
  '@media screen': {
    color: 'red',
  },
});

const ComponentC = styled.div({
  '@media (min-width: 500px)': {
    border: '2px solid red',
  },
});

const ComponentD = styled.div({
  '@media (min-width: 500px)': {
    border: '2px solid red',
    content: 'large screen',
  },
});

// @ts-expect-error -- cssMapScoped is not in public types
const baseStyles = cssMapScoped({
  default: {
    '.editor .panel': { backgroundColor: 'gray', padding: '8px' },
  },
});

// @ts-expect-error -- cssMapScoped is not in public types
const overrideStyles = cssMapScoped({
  default: {
    '.editor .panel': { backgroundColor: 'pink' },
  },
});

const App = () => (
  <>
    <ComponentA />
    <ComponentB />
    <ComponentC />
    <ComponentD />
    <div css={baseStyles.default}>
      <div className="editor">
        <div className="panel" />
      </div>
    </div>
    <div css={[baseStyles.default, overrideStyles.default]}>
      <div className="editor">
        <div className="panel" />
      </div>
    </div>
  </>
);
