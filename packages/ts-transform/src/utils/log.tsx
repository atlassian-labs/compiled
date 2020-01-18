import { name as packageName } from '../../../../package.json';

let enabled = false;

export const setEnabled = (on: boolean) => {
  enabled = on;
};

const defaultSuffix = `
  ${packageName} ==> `;

export const log = (msg: any, suffix: string = defaultSuffix) => {
  if (enabled) {
    console.log(`${suffix}${msg}`);
  }
};
