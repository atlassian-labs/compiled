import chalk from 'chalk';
import { AutoComplete, Form, List } from 'enquirer';
import { promise as execAsync } from 'exec-sh';

import { castToJestMock } from '../../../__tests__/test-utils';
import codemods from '../codemods';
import type { CodemodOptions } from '../types';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(),
  Form: jest.fn(),
  List: jest.fn(),
}));

jest.mock('exec-sh', () => ({
  promise: jest.fn(),
}));

const expectCodemodToHaveBeenRan = (name: string, runPath: string) => {
  const regexPath = runPath.replace(/\\/g, '\\').replace(/\*/g, '\\*');

  expect(execAsync).toHaveBeenCalledWith(
    expect.stringMatching(
      new RegExp(
        `.*--transform=.*node_modules\\/@compiled\\/codemods\\/(dist|src)\\/transforms\\/${name}\\/index.(ts|js) ${regexPath}`
      )
    )
  );
};

const expectCodemodToHaveOption = (key: string, value: string) => {
  expect(execAsync).toHaveBeenCalledWith(expect.stringContaining(`${key}=${value}`));
};

const setupCliRunner = (opts: {
  choice: number;
  runPath: string;
  codemodOpts?: CodemodOptions;
  pluginPaths?: string[];
}) => {
  castToJestMock(AutoComplete).mockImplementation(
    ({ choices, result }: any) =>
      ({
        run: () => Promise.resolve(result(choices[opts.choice])),
      } as any)
  );

  castToJestMock(Form).mockImplementation(
    () =>
      ({
        run: () =>
          Promise.resolve({
            parser: 'tsx',
            ...opts.codemodOpts,
            path: opts.runPath,
          }),
      } as any)
  );

  castToJestMock(List).mockImplementation(
    () =>
      ({
        run: () => Promise.resolve([...(opts.pluginPaths || [])]),
      } as any)
  );
};

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation();
    jest.spyOn(global.console, 'warn').mockImplementation();
  });

  afterEach(() => {
    castToJestMock(global.console.log).mockReset();
    castToJestMock(global.console.warn).mockReset();
    castToJestMock(AutoComplete).mockReset();
    castToJestMock(Form).mockReset();
    castToJestMock(execAsync).mockReset();
  });

  it('should present all available codemods in an autocomplete', async () => {
    setupCliRunner({ choice: 0, runPath: 'src/components/Button.tsx' });

    await codemods();

    expect(AutoComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [
          'emotion-to-compiled',
          'styled-components-inner-ref-to-ref',
          'styled-components-to-compiled',
        ],
        limit: 18,
        message: 'Select which codemod would you like to run? 🤔',
      })
    );
  });

  it('should present a form after autocomplete for user input for jscodeshift cli', async () => {
    setupCliRunner({ choice: 0, runPath: 'src/components/Button.tsx' });

    await codemods();

    expect(Form).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [
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
        ],
        hint: chalk.bold(
          chalk.red(
            '**NOTE**: [PATH] is mandatory option. It is the source code directory eg. /project/src'
          )
        ),
        message: `Please provide the following jscodeshift cli options ${chalk.cyan(
          '<https://github.com/facebook/jscodeshift#usage-cli>'
        )}`,
        name: 'jscodeshift',
      })
    );
  });

  it('should run on 8 cpus', async () => {
    setupCliRunner({ choice: 0, runPath: 'src/components/**/*.tsx' });

    await codemods();

    expectCodemodToHaveOption('cpus', '8');
  });

  it('should run emotion codemod with default options', async () => {
    const path = 'src/components/Button.tsx';
    setupCliRunner({ choice: 0, runPath: path });

    await codemods();

    expectCodemodToHaveBeenRan('emotion-to-compiled', path);
  });

  it('should run styled inner ref to ref codemod with default options', async () => {
    const path = 'src/components/Button.tsx';
    setupCliRunner({ choice: 1, runPath: path });

    await codemods();

    expectCodemodToHaveBeenRan('styled-components-inner-ref-to-ref', path);
  });

  it('should run styled codemod with default options', async () => {
    const path = 'src/components/Button.tsx';
    setupCliRunner({ choice: 2, runPath: path });

    await codemods();

    expectCodemodToHaveBeenRan('styled-components-to-compiled', path);
  });

  it('should run emotion codemod with all custom options', async () => {
    const path = 'src/components/**/*.tsx';
    setupCliRunner({
      choice: 0,
      codemodOpts: {
        extensions: 'tsx',
        ignorePattern: '**/*utils*',
        parser: 'tsx',
      },
      runPath: path,
    });

    await codemods();

    expectCodemodToHaveBeenRan('emotion-to-compiled', path);
    expectCodemodToHaveOption('parser', 'tsx');
    expectCodemodToHaveOption('extensions', 'tsx');
    expectCodemodToHaveOption('ignore-pattern', '**/*utils*');
  });

  it('should run codemod with plugins', async () => {
    const path = 'src/components/Button.tsx';
    setupCliRunner({ choice: 0, pluginPaths: ['path1', 'path2'], runPath: path });

    await codemods();

    expectCodemodToHaveBeenRan('emotion-to-compiled', path);
    expectCodemodToHaveOption('plugin', '"path1"');
    expectCodemodToHaveOption('plugin', '"path2"');
  });
});
