import { readFile } from 'fs/promises';

import { analyze, type DataAttributeBreakdown, type NestedSelectorBreakdown } from '@compiled/css';
import { Args, Command, Flags } from '@oclif/core';

import { makeDim, makeItalic } from './util';

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

  private printDataAttributeBreakdown(dataAttributeBreakdown: DataAttributeBreakdown) {
    const maxAttributeLength = Math.max(
      ...Object.keys(dataAttributeBreakdown).map((k) => k.length)
    );

    // Sort data attributes from most frequently used to least
    const sortedBreakdown = Object.entries(dataAttributeBreakdown).sort(([, a], [, b]) => b - a);

    for (const [dataAttribute, frequency] of sortedBreakdown) {
      console.log(
        makeDim(`  ${(dataAttribute + ':').padEnd(maxAttributeLength + 1, ' ')} ${frequency}`)
      );
    }
  }

  private printNestedSelectorBreakdown(selectorBreakdown: NestedSelectorBreakdown) {
    for (const [layer, frequency] of Object.entries(selectorBreakdown)) {
      console.log(makeDim(`  ${layer} layers of nesting: ${frequency}`));
    }
  }

  async run(): Promise<void> {
    console.log('Analyzing compiled-css.css file...');
    const { flags, args } = await this.parse(AnalyzeCompiledCss);

    const stylesheet = await this.getStylesheet(args.filename, flags.removeLastLine);
    const report = analyze(stylesheet, flags.cssVariableFilter);

    console.log();
    console.log('====================================');
    console.log(`Number of total rules analyzed: ${report.total}`);
    console.log('====================================');
    console.log(`Has data-* attribute(s):        ${report.hasDataAttribute}`);
    console.log(makeItalic('↳ Data attributes found:'));
    this.printDataAttributeBreakdown(report.dataAttributes);
    console.log('------------------------------------');
    console.log(`Has nested selector:            ${report.hasNestedSelector}`);
    console.log(makeItalic('↳ Breakdown:'));
    this.printNestedSelectorBreakdown(report.nestedSelectors);
    console.log('------------------------------------');
    console.log(`Has inline image:               ${report.hasInlineImage}`);
    console.log(`Uses CSS variables:             ${report.hasVariable}`);
    console.log('====================================');
    console.log();
    console.log('Done!');
  }
}
