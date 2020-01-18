let enabled = false;

export const setEnabled = (on: boolean) => {
  enabled = on;
};

const defaultSuffix = `
  @compiled/ts-transform-css-in-js ==> `;

export const log = (msg: any, suffix: string = defaultSuffix) => {
  if (enabled) {
    console.log(`${suffix}${msg}`);
  }
};
