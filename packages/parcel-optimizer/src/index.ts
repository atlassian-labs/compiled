import assert from 'assert';
import { join, basename } from 'path';

import { sort } from '@compiled/css';
import { hash } from '@compiled/utils';
import { Optimizer } from '@parcel/plugin';
import posthtml from 'posthtml';
import { insertAt } from 'posthtml-insert-at';

import type { ParcelOptimizerOpts } from './types';

const configFiles = [
  '.compiledcssrc',
  '.compiledcssrc.json',
  'compiledcss.js',
  'compiledcss.config.js',
];

// Keep this local to avoid expanding @compiled/css' public API for an optimizer-only concern.
const NON_ATOMIC_CLASS_SELECTOR = '.cc-';

/**
 * Sort rules within a single asset: preserve non-atomic cssMapScoped rule
 * source order (cascade-dependent), sort atomic rules lexically (deterministic).
 */
export const sortStyleRulesForDeterministicOutput = (styleRules: string[]): string[] => {
  const nonAtomicRules: string[] = [];
  const atomicRules: string[] = [];

  for (const rule of styleRules) {
    if (rule.includes(NON_ATOMIC_CLASS_SELECTOR)) {
      nonAtomicRules.push(rule);
    } else {
      atomicRules.push(rule);
    }
  }

  return [...nonAtomicRules, ...atomicRules.sort()];
};

/**
 * Build a deterministic stylesheet from multiple assets.
 * Assets are sorted by filePath for stable cross-file ordering, then
 * rules are collected (deduplicated) into a single Set, partitioned into
 * non-atomic (preserved order) and atomic (lexically sorted) buckets,
 * and finally passed through @compiled/css sort() for semantic sorting.
 */
export const buildDeterministicStylesheet = (
  assets: { filePath: string; rules: string[] }[],
  sortConfig: { sortAtRulesEnabled: boolean | undefined; sortShorthandEnabled: boolean | undefined }
): string => {
  const styleRules = new Set<string>();
  [...assets]
    // sort assets by filePath, filePath is absolute file path including file name.
    .sort((a, b) => (a.filePath < b.filePath ? -1 : 1))
    // collect styleRules from sorted assets
    .forEach(({ rules }) => {
      for (const rule of rules) {
        styleRules.add(rule);
      }
    });
  return sort(sortStyleRulesForDeterministicOutput(Array.from(styleRules)).join(''), sortConfig);
};

export default new Optimizer<ParcelOptimizerOpts, unknown>({
  async loadConfig({ config, options }) {
    const conf = await config.getConfigFrom(join(options.projectRoot, 'index'), configFiles, {
      packageKey: '@compiled/parcel-optimizer',
    });

    const contents = {
      inlineCss: false,
      sortAtRules: true,
    };

    if (conf) {
      if (conf.filePath.endsWith('.js')) {
        config.invalidateOnStartup();
      }

      Object.assign(contents, conf.contents);
    }

    return contents;
  },

  async optimize({ contents, map, bundle, bundleGraph, options, config }) {
    const { outputFS } = options;

    // Collect assets with their styleRules from the bundle graph.
    // bundleGraph traversal order is non-deterministic, so we collect first
    // and sort by filePath before concatenating.
    const assetsWithRules: { filePath: string; rules: string[] }[] = [];

    bundleGraph.traverseBundles((childBundle) => {
      childBundle.traverseAssets((asset) => {
        const rules = asset.meta.styleRules;
        if (rules == null) {
          return;
        }

        assert(Array.isArray(rules));

        assetsWithRules.push({
          filePath: asset.filePath,
          rules: rules as string[],
        });
      });
    }, bundle);

    if (assetsWithRules.length === 0) return { contents, map };

    const sortConfig = {
      sortAtRulesEnabled: config.sortAtRules,
      sortShorthandEnabled: config.sortShorthand,
    };

    const stylesheet = buildDeterministicStylesheet(assetsWithRules, sortConfig);

    let newContents = '';

    if (config.inlineCss) {
      newContents = (
        await posthtml()
          .use(
            insertAt({
              selector: 'head',
              append: '<style>' + stylesheet + '</style>',
              behavior: 'inside',
            })
          )
          .process(contents.toString())
      ).html;
    } else {
      const { distDir } = bundle.target;

      if (!outputFS.existsSync(distDir)) {
        await outputFS.mkdirp(distDir);
      }

      const cssFileName = basename(bundle.displayName, '.html') + '.' + hash(stylesheet) + '.css';

      await outputFS.writeFile(
        join(distDir, cssFileName),
        stylesheet,
        undefined // for TypeScript
      );

      newContents = (
        await posthtml()
          .use(
            insertAt({
              selector: 'head',
              append:
                '<link href="' + bundle.target.publicUrl + cssFileName + '" rel="stylesheet" />',
              behavior: 'inside',
            })
          )
          .process(contents.toString())
      ).html;
    }

    return { contents: newContents, map };
  },
});
