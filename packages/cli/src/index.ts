#!/usr/bin/env node

import chalk from 'chalk';

import cli from './cli';
import main from './main';

(async () => {
  try {
    await main(cli);
  } catch ({ message }) {
    if (message) {
      console.error(chalk.red(message));
    }

    process.exitCode = 1;
  }
})();
