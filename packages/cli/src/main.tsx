import chalk from 'chalk';
import { AutoComplete } from 'enquirer';

import type { Result } from './cli';
import presets from './presets';

const getPresetPrompt = async (): Promise<string> =>
  await new AutoComplete({
    choices: Object.keys(presets),
    limit: 18,
    message: 'Select which preset would you like to run? 🤔',
  }).run();

const executePreset = async (cli: Result) => {
  const presetFromCLI = cli.flags.preset || (await getPresetPrompt());

  const preset = presets[presetFromCLI];

  if (!preset) {
    console.warn(
      chalk.red(`"${presetFromCLI}" is not a valid preset. Please specify a valid one.`)
    );

    return cli.showHelp(1);
  }

  await preset(cli);
};

const main = async (cli: Result): Promise<void> => {
  console.log(chalk.bgCyan(chalk.black('👷 Compiled cli 👷')));

  await executePreset(cli);
};

export default main;
