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

import { castToJestMock } from '../../../testUtils';

import codemods from '../codemods';

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation();
    jest.spyOn(global.console, 'warn').mockImplementation();
  });

  afterEach(() => {
    castToJestMock(global.console.log).mockReset();
    castToJestMock(global.console.warn).mockReset();
    castToJestMock(globSync).mockReset();
    castToJestMock(AutoComplete).mockReset();
    castToJestMock(Form).mockReset();
    castToJestMock(execShPromise).mockReset();
  });

  it('should should warn if no codemods are available', async () => {
    castToJestMock(globSync).mockImplementationOnce(() => []);

    await codemods();

    expect(global.console.warn).toHaveBeenCalledWith(chalk.red('No codemods available right now.'));

    expect(AutoComplete).not.toHaveBeenCalledTimes(1);

    expect(Form).not.toHaveBeenCalledTimes(1);

    expect(execShPromise).not.toHaveBeenCalledTimes(1);
  });

  it('should run transforms contained in directories with filtered jscodeshift options', async () => {
    castToJestMock(globSync).mockImplementationOnce(() => [
      'node_modules/@compiled/react/dist/codemods/styled-components-to-compiled/index.tsx',
      'node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx',
    ]);

    castToJestMock(AutoComplete).mockImplementation(({ choices, result }) => ({
      run: () => Promise.resolve(result(choices[0])),
    }));

    castToJestMock(Form).mockImplementation(() => ({
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
        hint: chalk.bold(
          chalk.red(
            '**NOTE**: [PATH] is mandatory option. It is the source code directory eg. /project/src'
          )
        ),
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
        ],
      })
    );

    expect(execShPromise).toHaveBeenCalledWith(
      expect.stringContaining(
        '--cpus=8 --parser=tsx --transform=node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx src/components/Button.tsx'
      )
    );
  });

  it('should run transforms contained in directories with all jscodeshift options', async () => {
    castToJestMock(globSync).mockImplementationOnce(() => [
      'node_modules/@compiled/react/dist/codemods/styled-components-to-compiled/index.tsx',
      'node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx',
    ]);

    castToJestMock(AutoComplete).mockImplementation(({ choices, result }) => ({
      run: () => Promise.resolve(result(choices[0])),
    }));

    castToJestMock(Form).mockImplementation(() => ({
      run: () =>
        Promise.resolve({
          parser: 'tsx',
          extensions: 'tsx',
          ignorePattern: '**/*utils*',
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
        hint: chalk.bold(
          chalk.red(
            '**NOTE**: [PATH] is mandatory option. It is the source code directory eg. /project/src'
          )
        ),
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
        ],
      })
    );

    expect(execShPromise).toHaveBeenCalledWith(
      expect.stringContaining(
        '--cpus=8 --parser=tsx --extensions=tsx --ignore-pattern=**/*utils* --transform=node_modules/@compiled/react/dist/codemods/emotion-to-compiled/index.tsx src/components/**/*.tsx'
      )
    );
  });
});
