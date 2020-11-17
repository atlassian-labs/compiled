jest.mock('glob', () => ({
  sync: jest.fn(),
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(),
  Form: jest.fn(),
}));

jest.mock('exec-sh', () => ({
  promise: jest.fn(),
}));

import { sync as globSync } from 'glob';
import chalk from 'chalk';
import { AutoComplete, Form } from 'enquirer';
import { promise as execShPromise } from 'exec-sh';

import codemods from '../codemods';

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation();
    jest.spyOn(global.console, 'warn').mockImplementation();
  });

  afterEach(() => {
    (global.console.log as jest.Mock).mockReset();
    (global.console.warn as jest.Mock).mockReset();
    (globSync as jest.Mock).mockReset();
    ((AutoComplete as unknown) as jest.Mock).mockReset();
    ((Form as unknown) as jest.Mock).mockReset();
    ((execShPromise as unknown) as jest.Mock).mockReset();
  });

  it('should should warn if no codemods are available', async () => {
    (globSync as jest.Mock).mockImplementationOnce(() => []);

    await codemods();

    expect(global.console.warn).toHaveBeenCalledWith(chalk.red('No codemods available right now.'));

    expect(AutoComplete).not.toHaveBeenCalledTimes(1);

    expect(Form).not.toHaveBeenCalledTimes(1);

    expect(execShPromise).not.toHaveBeenCalledTimes(1);
  });

  it('should run transforms contained in directories with filtered jscodeshift options', async () => {
    (globSync as jest.Mock).mockImplementationOnce(() => [
      'node_modules/@compiled/react/dist/codemods/styled-components-to-compiled/index.tsx',
      'node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx',
    ]);

    ((AutoComplete as unknown) as jest.Mock).mockImplementation(({ choices, result }) => ({
      run: () => Promise.resolve(result(choices[0])),
    }));

    ((Form as unknown) as jest.Mock).mockImplementation(() => ({
      run: () =>
        Promise.resolve({
          parser: 'tsx',
          path: 'src/components/Button.tsx',
        }),
    }));

    await codemods();

    expect(AutoComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select which codemod would you like to run? 🤔',
        limit: 18,
        choices: ['emotion-to-compiled', 'styled-components-to-compiled'],
      })
    );

    expect(Form).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    );

    expect(execShPromise).toHaveBeenCalledWith(
      'jscodeshift --parser=tsx --transform=node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx src/components/Button.tsx'
    );
  });

  it('should run transforms contained in directories with all jscodeshift options', async () => {
    (globSync as jest.Mock).mockImplementationOnce(() => [
      'node_modules/@compiled/react/dist/codemods/styled-components-to-compiled/index.tsx',
      'node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx',
    ]);

    ((AutoComplete as unknown) as jest.Mock).mockImplementation(({ choices, result }) => ({
      run: () => Promise.resolve(result(choices[0])),
    }));

    ((Form as unknown) as jest.Mock).mockImplementation(() => ({
      run: () =>
        Promise.resolve({
          parser: 'tsx',
          extensions: 'tsx',
          ignorePattern: '**/*utils*',
          others: '--verbose=2 --cpus=1',
          path: 'src/components/**/*.tsx',
        }),
    }));

    await codemods();

    expect(AutoComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select which codemod would you like to run? 🤔',
        limit: 18,
        choices: ['emotion-to-compiled', 'styled-components-to-compiled'],
      })
    );

    expect(Form).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    );

    expect(execShPromise).toHaveBeenCalledWith(
      'jscodeshift --parser=tsx --extensions=tsx --ignore-pattern=**/*utils* --verbose=2 --cpus=1 --transform=node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx src/components/**/*.tsx'
    );
  });
});
