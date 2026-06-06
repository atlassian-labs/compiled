// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap } from '@compiled/react';

const styles = cssMap({ danger: { color: 'red' } });

// Verify hashStrategy is NOT part of the public type signature.
// If this @ts-expect-error ever becomes unnecessary, hashStrategy has been accidentally re-exposed.
// @ts-expect-error -- hashStrategy is not available yet, used with extreme caution
const stylesWithHashStrategy = cssMap({ danger: { color: 'red' } }, { hashStrategy: 'max' });

export { styles, stylesWithHashStrategy };
