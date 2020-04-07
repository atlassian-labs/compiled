import { configure } from '@storybook/react';
import { addDecorator } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';

addDecorator(withPerformance);

// automatically import all files ending in *.stories.js
configure(require.context('../examples', false, /\.tsx$/), module);
