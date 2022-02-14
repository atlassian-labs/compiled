import chalk from 'chalk';
import type { API, FileInfo, Options } from 'jscodeshift';

import type { CodemodPlugin } from '../plugins/types';

type PluginItem = CodemodPlugin | string;

const isCodemodPlugin = (pluginItem: PluginItem): pluginItem is CodemodPlugin =>
  typeof pluginItem === 'object';

const getPlugins = (
  items: PluginItem | PluginItem[]
): CodemodPlugin[] | Promise<CodemodPlugin[]> => {
  const pluginItems = Array.isArray(items) ? items : [items];
  // Remove this code block once https://github.com/facebook/jscodeshift/issues/454 is resolved
  if (pluginItems.every(isCodemodPlugin)) {
    return pluginItems;
  }

  return Promise.all(
    pluginItems.map(async (pluginItem) => {
      if (isCodemodPlugin(pluginItem)) {
        return pluginItem;
      }

      try {
        const pluginModule = await import(pluginItem);

        const pluginName = pluginModule?.default?.name;
        if (!pluginName) {
          throw new Error(
            chalk.yellow(`${chalk.bold(`Plugin at path '${pluginItem}' did not export 'name'`)}`)
          );
        }

        return pluginModule.default;
      } catch (err) {
        throw new Error(
          chalk.red(`${chalk.bold(`Plugin at path '${pluginItem}' was not loaded`)}\n${err}`)
        );
      }
    })
  );
};

/*
 * This functionality is implemented as a higher-order function as jscodeshift
 * test utilities do not support promises. This means we keep the async functionality
 * on the dynamic import
 */
export const withPlugin =
  (transformer: (fileInfo: FileInfo, api: API, options: Options) => string) =>
  (fileInfo: FileInfo, api: API, options: Options): string | Promise<string> => {
    const plugins = options.plugin ?? options.plugins ?? [];
    // TODO Await this when https://github.com/facebook/jscodeshift/issues/454 is resolved
    const maybeNormalizedPlugins = getPlugins(plugins);
    if (maybeNormalizedPlugins instanceof Promise) {
      return maybeNormalizedPlugins.then((normalizedPlugins) =>
        transformer(fileInfo, api, {
          ...options,
          normalizedPlugins,
        })
      );
    }

    return transformer(fileInfo, api, {
      ...options,
      normalizedPlugins: maybeNormalizedPlugins,
    });
  };
