// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap } from '@compiled/react';

const styles = cssMap({ danger: { color: 'red' } });

// Verify atomic is NOT part of the public type signature.
// If this @ts-expect-error ever becomes unnecessary, atomic has been accidentally re-exposed.
// @ts-expect-error -- atomic is not part of the public API, used with extreme caution internally
const stylesWithAtomic = cssMap({ danger: { color: 'red' } }, { atomic: false });

export { styles, stylesWithAtomic };
