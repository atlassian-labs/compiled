import { name as packageName } from '../../../package.json';

let enabled = false;

export const setEnabled = (on: boolean) => {
  enabled = on;
};

export const log = (msg: string, suffix: string = `  ${packageName} ==> `) => {
  if (enabled) {
    console.log(`${suffix}${msg}`);
  }
};
