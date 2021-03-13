import { plugin } from 'postcss';

/**
 * Plugin to remove duplicate children found in at rules.
 *
 * Before:
 *
 * ```css
 * @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
 * @media (min-width:500px){._171dak0l{border:2px solid red}}
 * ```
 *
 * After:
 *
 * ```css
 * @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
 * ```
 */
export const discardDuplicateAtRuleChildren = plugin('discard-duplicate-at-rule-children', () => {
  return (root) => {};
});
