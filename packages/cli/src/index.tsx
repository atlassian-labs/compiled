#!/usr/bin/env node

import chalk from 'chalk';

import main from './main';
import cli from './cli';

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
