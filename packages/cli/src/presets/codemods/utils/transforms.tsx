import path, { ParsedPath } from 'path';
import glob from 'glob';
import appRoot from 'app-root-path';

const basePath = path.join(
  appRoot.path,
  'node_modules',
  '@compiled',
  'react',
  'dist',
  'cjs',
  'codemods'
);

const parseTransformPath = (transformPath: string) => path.parse(transformPath);

export const getTransformPath = ({ dir, base }: ParsedPath) => `${dir}/${base}`;

export const getTransforms = (): ParsedPath[] =>
  [path.join(basePath, '*', 'index.@(ts|tsx|js)')]
    .flatMap((transform) => glob.sync(transform))
    .map((transform) => parseTransformPath(transform))
    .sort((prevParsedPath, nextParsedPath) => prevParsedPath.dir.localeCompare(nextParsedPath.dir));
