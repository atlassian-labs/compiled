import { name as packageName } from '../../../package.json';

let enabled = false;

export const setEnabled = (on: boolean) => {
  enabled = on;
};

const defaultSuffix = `
  ${packageName} ==> `;

export const log = (msg: string, suffix: string = defaultSuffix) => {
  if (enabled) {
    console.log(`${suffix}${msg}`);
  }
};
