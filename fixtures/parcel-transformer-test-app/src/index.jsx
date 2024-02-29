console.log('File START');

import { css } from '@compiled/react';

const styles = css({ backgroundColor: 'green' });

const App = () => (
  <>
    <div css={[{ fontSize: 50, color: 'red' }, styles]}>hello from parcel</div>
  </>
);

console.log('File END');
