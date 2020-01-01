/** @jsx jsx */
import { jsx } from '../src';
import { hover } from './mixins/mixins';

console.log(hover);

export const objectLiteralImportedObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
      }}>
      Hello, world!
    </div>
  );
};
