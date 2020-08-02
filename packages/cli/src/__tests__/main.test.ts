jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(),
}));

jest.mock('../presets', () => ({
  mockedPreset: jest.fn(),
}));

import chalk from 'chalk';
import { AutoComplete } from 'enquirer';

import presets from '../presets';
import main from '../main';

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation();
    jest.spyOn(global.console, 'warn').mockImplementation();
  });

  afterEach(() => {
    (global.console.log as jest.Mock).mockReset();
    (global.console.warn as jest.Mock).mockReset();
    ((AutoComplete as unknown) as jest.Mock).mockReset();
    (presets.mockedPreset as jest.Mock).mockReset();
  });

  const setup = async (preset: string) => {
    const cli = {
      flags: {
        preset,
      },
      input: [],
      unnormalizedFlags: { preset },
      pkg: {},
      help: '',
      showHelp: jest.fn(),
      showVersion: jest.fn(),
    };

    await main(cli);

    return {
      cli,
    };
  };

  it('should warn when invalid preset is provided as cli input', async () => {
    const { cli } = await setup('invalid-using-cli');

    expect(AutoComplete).not.toHaveBeenCalledTimes(1);

    expect(global.console.warn).toHaveBeenCalledWith(
      chalk.red('"invalid-using-cli" is not a valid preset. Please specify a valid one.')
    );

    expect(cli.showHelp).toHaveBeenCalledWith(1);

    expect(presets.mockedPreset).not.toHaveBeenCalledWith(cli);
  });

  it('should warn when invalid preset is provided using prompt', async () => {
    ((AutoComplete as unknown) as jest.Mock).mockImplementation(() => ({
      run: () => Promise.resolve('invalid-using-prompt'),
    }));

    const { cli } = await setup('');

    expect(AutoComplete).toHaveBeenCalledWith({
      message: 'Select which preset would you like to run? 🤔',
      limit: 18,
      choices: ['mockedPreset'],
    });

    expect(global.console.warn).toHaveBeenCalledWith(
      chalk.red('"invalid-using-prompt" is not a valid preset. Please specify a valid one.')
    );

    expect(cli.showHelp).toHaveBeenCalledWith(1);

    expect(presets.mockedPreset).not.toHaveBeenCalledWith(cli);
  });

  it('should execute valid present when provided as cli input', async () => {
    (presets.mockedPreset as jest.Mock).mockImplementation(() => jest.fn());

    const { cli } = await setup('mockedPreset');

    expect(AutoComplete).not.toHaveBeenCalledTimes(1);

    expect(presets.mockedPreset).toHaveBeenCalledWith(cli);
  });

  it('should execute valid present when provided using prompt', async () => {
    (presets.mockedPreset as jest.Mock).mockImplementation(() => jest.fn());

    ((AutoComplete as unknown) as jest.Mock).mockImplementation(({ choices }) => ({
      run: () => Promise.resolve(choices[0]),
    }));

    const { cli } = await setup('');

    expect(AutoComplete).toHaveBeenCalledWith({
      message: 'Select which preset would you like to run? 🤔',
      limit: 18,
      choices: ['mockedPreset'],
    });

    expect(presets.mockedPreset).toHaveBeenCalledWith(cli);
  });
});
