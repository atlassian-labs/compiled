import { configure } from '@storybook/react';
import { addDecorator } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';

addDecorator(withPerformance);
configure(require.context('../examples', false, /\.(tsx)$/), module);
