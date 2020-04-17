import { configure } from '@storybook/react';
import { addDecorator } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';

window.__style_nonce__ = 'k0Mp1lEd';

addDecorator(withPerformance);

// automatically import all files ending in *.stories.js
configure(require.context('../examples', false, /\.tsx$/), module);
