import { readFile } from 'fs/promises';

import { analyze } from '@compiled/css';
import { Args, Command, Flags } from '@oclif/core';

export default class AnalyzeCompiledCss extends Command {
  static description =
    'Analyse a compiled-css.css file and get some stats of how many ineffective and non-reusable selectors are being used.';

  static examples = [
    `$ compiled-cli --removeLastLine --cssVariableFilter="ds-" compiled-css.css
Analysing compiled-css.css file...

====================================
Number of rules:                4000
------------------------------------
PROBLEMATIC:
------------------------------------
Has inline image:               5
Has nested selector:            1000
Uses CSS variables:             250
====================================

Done.`,
  ];

  static flags = {
    removeLastLine: Flags.boolean({
      summary:
        'Remove the last line of the file before analysing it. We may want to do this because the last line is often a sourcemap comment (which we want to ignore).',
    }),
    cssVariableFilter: Flags.string({
      summary:
        'In the report, we exclude all CSS variables that start with the value of the cssVariableFilter flag.',
    }),
  };

  static args = {
    filename: Args.string({
      description: 'Path to the compiled-css.css file we would like to analyse',
      required: true,
    }),
  };

  private async getStylesheet(filename: string, removeLastLine: boolean): Promise<string> {
    const stylesheet = await readFile(filename, {
      encoding: 'utf-8',
      flag: 'r',
    });

    if (removeLastLine) {
      const trimmedStylesheet = stylesheet.slice(0, stylesheet.lastIndexOf('\n'));
      return trimmedStylesheet;
    }

    return stylesheet;
  }

  async run(): Promise<void> {
    console.log('Analysing compiled-css.css file...');
    const { flags, args } = await this.parse(AnalyzeCompiledCss);

    const stylesheet = await this.getStylesheet(args.filename, flags.removeLastLine);
    const report = analyze(stylesheet, flags.cssVariableFilter);

    console.log();
    console.log('====================================');
    console.log(`Number of rules:                ${report.total}`);
    console.log('------------------------------------');
    console.log('PROBLEMATIC:');
    console.log('------------------------------------');
    console.log(`Has inline image:               ${report.hasInlineImage}`);
    console.log(`Has nested selector:            ${report.hasNestedSelector}`);
    console.log(`Uses CSS variables:             ${report.hasVariable}`);
    console.log('====================================');
    console.log();
    console.log('Done.');
  }
}
