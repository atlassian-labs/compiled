import * as Fs from 'fs';
import * as path from 'path';

interface FsOrigin {
  fs: typeof Fs;
  path: string;
}

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

export function list(dir: string, fs: typeof Fs, basedir?: string): string[] {
  const base = typeof basedir === 'string' ? basedir : dir;

  return fs
    .readdirSync(dir)
    .map((subPath: string) => {
      const p = path.resolve(dir, subPath);
      const stat = fs.statSync(p);

      if (stat.isDirectory()) {
        return list(p, fs, base);
      } else {
        return [path.relative(base, p)];
      }
    })
    .reduce((acc, ps) => [...acc, ...ps], []);
}
