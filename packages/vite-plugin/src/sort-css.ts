// Separate module for CSS sorting to avoid bundling issues with Vite config
// Uses require to avoid static resolution during Vite config bundling
/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

const css = require('@compiled/css');
export const sort = css.sort;
