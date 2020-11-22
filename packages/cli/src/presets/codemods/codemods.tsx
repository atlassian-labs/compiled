import chalk from 'chalk';
import path, { ParsedPath } from 'path';
import { AutoComplete, Form } from 'enquirer';
import { promise as execShPromise } from 'exec-sh';

import { getTransforms, getTransformPath } from './utils/transforms';

const getTransformPrompt = async (transforms: ParsedPath[]): Promise<ParsedPath> =>
  await new AutoComplete({
    message: 'Select which codemod would you like to run? 🤔',
    limit: 18,
    choices: transforms.map(({ dir }) => path.basename(dir)),
    result: (choice: string) => transforms.find(({ dir }) => dir.includes(choice)),
  }).run();

const getTransformForm = async () =>
  await new Form({
    name: 'jscodeshift',
    message: `Please provide the following jscodeshift cli options ${chalk.cyan(
      '<https://github.com/facebook/jscodeshift#usage-cli>'
    )}`,
    hint: chalk.bold(chalk.red('**NOTE**: [PATH] is mandatory option')),
    choices: [
      {
        name: 'path',
        message: 'PATH',
      },
      {
        name: 'parser',
        message: '--parser',
        hint: `default: ${chalk.cyan('babel')}`,
      },
      {
        name: 'extensions',
        message: '--extensions',
        hint: `default: ${chalk.cyan('js')}`,
      },
      {
        name: 'ignorePattern',
        message: '--ignore-pattern',
      },
      {
        name: 'others',
        message: 'other cli options',
        hint: `eg. ${chalk.cyan('--verbose=0 --version --help --silent')}`,
      },
    ],
  }).run();

const codemods = async () => {
  const transforms = getTransforms();

  if (transforms.length === 0) {
    return console.warn(chalk.red('No codemods available right now.'));
  }

  const transform = await getTransformPrompt(transforms);

  const transformPath = getTransformPath(transform);

  const form = await getTransformForm();

  const args = [
    form.parser && `--parser=${form.parser}`,
    form.extensions && `--extensions=${form.extensions}`,
    form.ignorePattern && `--ignore-pattern=${form.ignorePattern}`,
    form.others,
    `--transform=${transformPath}`,
    form.path,
  ].filter((arg) => !!arg);

  const command = ['jscodeshift', ...args].join(' ');

  console.log(
    chalk.green(
      `Running codemod '${chalk.bold(path.basename(transform.dir))}' with command:
'${chalk.bold(command)}'...`
    )
  );

  await execShPromise(command);
};

export default codemods;
