import chalk from 'chalk';
import meow from 'meow';

import presets from './presets';

const cli = meow(
  `
  Usage
    ${chalk.cyan('npx @compiled/cli [options]')}

  Options
    --preset, -p the preset to run. ${chalk.cyan('Available presets:')} ${Object.keys(presets)
    .map((preset) => chalk.green(preset))
    .join('|')}
    --help Help me 😱

  Examples
    ${chalk.cyan('npx @compiled/cli -p codemods')}
    ${chalk.cyan('npx @compiled/cli --preset codemods')}
`,
  {
    flags: {
      preset: {
        type: 'string',
        alias: 'p',
      },
    },
  }
);

export type Result = typeof cli;

export default cli;
