import { css } from '@compiled/react';
import React from 'react';

@annotation
class Annotated extends React.Component {
  static annotated = false;

  render() {
    return Annotated.annotated ? (
      <div css={{ backgroundColor: 'green' }}>Annotation class with green background div</div>
    ) : (
      <div>Annotation did not work!</div>
    );
  }
}

function annotation(target) {
  target.annotated = true;
  return target;
}

export default Annotated;
