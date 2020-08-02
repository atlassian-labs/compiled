import path, { ParsedPath } from 'path';
import glob from 'glob';

import isDev from '../../../isDev';

const basePath = isDev
  ? path.join(process.cwd(), '..', 'css-in-js', 'src', 'codemods')
  : path.join(process.cwd(), 'node_modules', '@compiled', 'css-in-js', 'dist', 'codemods');

const parseTransformPath = (transformPath: string) => path.parse(transformPath);

export const getTransformPath = ({ dir, base }: ParsedPath) => `${dir}/${base}`;

export const getTransforms = (): ParsedPath[] =>
  [path.join(basePath, '*', 'index.@(ts|js)')]
    .flatMap((transform) => glob.sync(transform))
    .map((transform) => parseTransformPath(transform))
    .sort((prevParsedPath, nextParsedPath) => prevParsedPath.dir.localeCompare(nextParsedPath.dir));
