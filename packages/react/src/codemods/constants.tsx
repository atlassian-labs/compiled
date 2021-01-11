/**
 * Because we don't want to include package json in the build artefacts
 * AND because the location of package json will be different depending
 * on using source or built assets - we do this. Not great but for now
 * it's better than re-writing the build setup.
 */
const tryGetPkgJson = () => {
  try {
    return require('../../package.json');
  } catch {
    return require('../../../package.json');
  }
};

const pkgJson = tryGetPkgJson();

export const COMPILED_IMPORT_PATH = pkgJson.name;

export const REACT_IMPORT_PATH = 'react';

export const REACT_IMPORT_NAME = 'React';
