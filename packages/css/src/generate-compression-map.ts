import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

import { ClassNameGenerator } from './utils/class-name-generator';

const UNDERSCORE_UNICODE = 95;

/**
 * Generate a compression map, which is used by @compiled/babel-plugin to compress class names.
 * The compression map looks like { 'aaaabbbb': 'a', 'bbbbcccc': 'b' }
 *
 * @param stylesheet css content i.e. `.aaaabbbb{font-size: 10px}`
 * @param oldClassNameCompressionMap the previous compression map, which ensures the compression is deterministic.
 * @returns newClassNameCompressionMap
 */
export const generateCompressionMap = (
  css: string,
  opts?: { oldClassNameCompressionMap?: { [index: string]: string }; prefix?: string }
): undefined | { [index: string]: string } => {
  const { oldClassNameCompressionMap, prefix } = opts || {};

  let atomicClassNames: string[] = [];
  let nonAtomicClassNames: string[] = [];
  const classNameCompressionMap: { [index: string]: string } = {};
  const reservedClassNames: string[] = [];

  const selectorProcessor = selectorParser((selectors) => {
    selectors.walkClasses((node: selectorParser.ClassName | selectorParser.Identifier) => {
      if (node.value.charCodeAt(0) === UNDERSCORE_UNICODE && node.value.length === 9) {
        atomicClassNames.push(node.value.slice(1));
      } else {
        nonAtomicClassNames.push(node.value);
      }
    });
  });

  const result = postcss([
    {
      postcssPlugin: 'postcss-find-atomic-class-names',
      Rule(ruleNode) {
        selectorProcessor.process(ruleNode);
      },
    },
  ]).process(css, { from: undefined });

  // We need to access something to make the transformation happen.
  result.css;

  // Remove duplicates
  atomicClassNames = Array.from(new Set(atomicClassNames));
  nonAtomicClassNames = Array.from(new Set(nonAtomicClassNames));

  // `oldClassNameCompressionMap` is used to ensure class names are consistent between builds.
  // It means if `aaaabbbb` gets compressed to `a` previously, it needs to be compressed to `a` again.
  // If a compressed name exists in both stylesheet and old compression map, we assume it's a previously compressed class name, and keep it.
  if (oldClassNameCompressionMap) {
    atomicClassNames = atomicClassNames.filter((className) => {
      if (oldClassNameCompressionMap[className]) {
        reservedClassNames.push(oldClassNameCompressionMap[className]);
        classNameCompressionMap[className] = oldClassNameCompressionMap[className];
        return false;
      }
      return true;
    });

    if (Object.keys(classNameCompressionMap).length) {
      // We've found class names which exist in old compression map but not in the stylesheet.
      // Theoretically this should not happen. We want to warn the developers so they can investigate it. There is likely some race condition in the builds.
      console.warn(
        `${JSON.stringify(
          classNameCompressionMap
        )} exists in the old compression map but it's uncompressed in the stylesheet.`
      );
    }

    nonAtomicClassNames = nonAtomicClassNames.filter((className) => {
      for (const [key, value] of Object.entries(oldClassNameCompressionMap)) {
        if (value === className) {
          reservedClassNames.push(className);
          classNameCompressionMap[key] = className;
          return false;
        }
      }
      return true;
    });

    // We've found compressed class names which exist in stylesheet but not in old compression map.
    // Like the above, theoretically this should not happen. We want to warn the developers so they can investigate it. There is likely some race condition in the builds.
    if (nonAtomicClassNames.length) {
      console.warn(
        `${JSON.stringify(
          nonAtomicClassNames
        )} exists in the stylesheet but not in the old compression map.`
      );
    }
  }

  const classNameGenerator = new ClassNameGenerator({ reservedClassNames, prefix });
  atomicClassNames.forEach((className) => {
    const newClassName = classNameGenerator.generateClassName();
    classNameCompressionMap[className] = newClassName;
  });

  return classNameCompressionMap;
};
