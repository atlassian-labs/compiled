import type { ParsedPath } from 'path';
import path from 'path';

import chalk from 'chalk';
import { AutoComplete, Form, List } from 'enquirer';
import { promise as execAsync } from 'exec-sh';

import type { Choice, CodemodOptions } from './types';
import { getTransformPath, getTransforms } from './utils/transforms';

const getTransformPrompt = async (transforms: ParsedPath[]): Promise<ParsedPath> => {
  return await new AutoComplete({
    choices: transforms.map(({ dir }) => path.basename(dir)),
    limit: 18,
    message: 'Select which codemod would you like to run? 🤔',
    result: (choice: string) => transforms.find(({ dir }) => dir.includes(choice)),
  }).run();
};

const codemodChoice: Choice<keyof CodemodOptions>[] = [
  {
    message: 'PATH',
    name: 'path',
  },
  {
    hint: `default: ${chalk.cyan('babel')}`,
    message: '--parser',
    name: 'parser',
  },
  {
    hint: `default: ${chalk.cyan('js')}`,
    message: '--extensions',
    name: 'extensions',
  },
  {
    message: '--ignore-pattern',
    name: 'ignorePattern',
  },
];

const getTransformForm = async () => {
  return await new Form({
    choices: codemodChoice,
    hint: chalk.bold(
      chalk.red(
        '**NOTE**: [PATH] is mandatory option. It is the source code directory eg. /project/src'
      )
    ),
    message: `Please provide the following jscodeshift cli options ${chalk.cyan(
      '<https://github.com/facebook/jscodeshift#usage-cli>'
    )}`,
    name: 'jscodeshift',
  }).run();
};

const getPluginsForm = async (): Promise<string[]> => {
  const result = await new List({
    message: 'Specify any plugins you which to use (multiple can be specified separated with `,`)',
    name: 'plugins',
  }).run();

  return result;
};

const codemods = async (): Promise<void> => {
  const transforms = getTransforms();
  if (transforms.length === 0) {
    return console.warn(chalk.red('No codemods available right now.'));
  }

  const transform = await getTransformPrompt(transforms);
  const transformPath = getTransformPath(transform);
  const form = await getTransformForm();
  const plugins = await getPluginsForm();

  const args = [
    // Limit CPUs to 8 to prevent issues when running on CI with a large amount of cpus
    '--cpus=8',
    form.parser && `--parser=${form.parser}`,
    form.extensions && `--extensions=${form.extensions}`,
    form.ignorePattern && `--ignore-pattern=${form.ignorePattern}`,
    ...plugins.map((path) => `--plugin="${path}"`),
    form.others,
    `--transform=${transformPath}`,
    form.path,
  ].filter((arg) => !!arg);

  const command = ['node', require.resolve('.bin/jscodeshift'), ...args].join(' ');

  console.log(
    chalk.green(
      `Running codemod '${chalk.bold(path.basename(transform.dir))}' with command:
'${chalk.bold(command)}'...`
    )
  );

  await execAsync(command);
};

export default codemods;
