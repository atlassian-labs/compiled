/**
 * Only exports one thing from the components module.
 * If things are not tree shaking properly it will increase in size and `bundlesize` step will fail.
 */
export { StyledDiv } from './components';
