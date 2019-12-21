import * as Fs from 'fs';
import * as path from 'path';
import { IFs } from 'memfs';

interface FsOrigin {
  fs: FsLike;
  path: string;
}

type FsLike = IFs | typeof Fs;

export function mkdirp(at: FsOrigin): void {
  const fragments = at.path.split('/');

  fragments
    .map((_, index) => fragments.slice(0, index + 1).join('/'))
    .filter(Boolean)
    .filter(p => !at.fs.existsSync(p))
    .forEach(path => at.fs.mkdirSync(path));
}

export function copy(from: FsOrigin, to: FsOrigin): void {
  list(from.path, from.fs).forEach(subPath => {
    const sourcePath = path.resolve(from.path, subPath);
    const targetPath = path.resolve(to.path, subPath);
    mkdirp({ fs: to.fs, path: path.dirname(targetPath) });
    to.fs.writeFileSync(targetPath, from.fs.readFileSync(sourcePath));
  });
}

export function list(dir: string, fs: FsLike, basedir?: string): string[] {
  const base = typeof basedir === 'string' ? basedir : dir;
  const fileList = fs.readdirSync(dir, { encoding: 'buffer' });
  const paths = (fileList as unknown[]).map(item => String(item));

  return paths
    .map((subPath: string) => {
      const p = path.resolve(dir, String(subPath));
      const stat = fs.statSync(p);

      if (stat.isDirectory()) {
        return list(p, fs, base);
      } else {
        return [path.relative(base, p)];
      }
    })
    .reduce((acc, ps) => [...acc, ...ps], []);
}

export function createMockModule(name: string, fs: FsLike) {
  mkdirp({ path: `/node_modules/${name}`, fs });

  fs.writeFileSync(`/node_modules/${name}/index.js`, `module.exports = {};`);
  fs.writeFileSync(
    `/node_modules/${name}/index.d.ts`,
    `declare module "${name}" {
    export function jsx<P>(type: any, props: any, ...children: any[]) }
    export function styledFunction<P>( strings: any, ...interpoltations: any[]): any
    export function ClassNames(props: any): any
  `
  );

  fs.writeFileSync(
    `/node_modules/${name}/package.json`,
    JSON.stringify({ name, main: './src/index.tsx' })
  );
}
