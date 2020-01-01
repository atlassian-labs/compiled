/** @jsx jsx */
import { jsx } from '../src';
import { hover } from './mixins/mixins';

export const objectLiteralImportedObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ':hover': hover,
      }}>
      Hello, world!
    </div>
  );
};
