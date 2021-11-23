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
        `.*--transform=.*node_modules\\/@compiled\\/codemods\\/(dist|src)\\/transforms\\/${name}\\/index.(tsx|js) ${regexPath}`
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
        message: 'Select which codemod would you like to run? 🤔',
        limit: 18,
        choices: [
          'emotion-to-compiled',
          'styled-components-inner-ref-to-ref',
          'styled-components-to-compiled',
        ],
      })
    );
  });

  it('should present a form after autocomplete for user input for jscodeshift cli', async () => {
    setupCliRunner({ choice: 0, runPath: 'src/components/Button.tsx' });

    await codemods();

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
      runPath: path,
      codemodOpts: {
        parser: 'tsx',
        extensions: 'tsx',
        ignorePattern: '**/*utils*',
      },
    });

    await codemods();

    expectCodemodToHaveBeenRan('emotion-to-compiled', path);
    expectCodemodToHaveOption('parser', 'tsx');
    expectCodemodToHaveOption('extensions', 'tsx');
    expectCodemodToHaveOption('ignore-pattern', '**/*utils*');
  });

  it('should run codemod with plugins', async () => {
    const path = 'src/components/Button.tsx';
    setupCliRunner({ choice: 0, runPath: path, pluginPaths: ['path1', 'path2'] });

    await codemods();

    expectCodemodToHaveBeenRan('emotion-to-compiled', path);
    expectCodemodToHaveOption('plugin', '"path1"');
    expectCodemodToHaveOption('plugin', '"path2"');
  });
});
