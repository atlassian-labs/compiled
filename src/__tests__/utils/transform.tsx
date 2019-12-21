import * as Fs from 'fs';
import * as ts from 'typescript';
import { Volume, IFs } from 'memfs';
import * as path from 'path';
import * as resolveModule from 'resolve';
import pkg from '../../../package.json';
import { copy, mkdirp, createMockModule } from './memfs';

const printer = ts.createPrinter();

type ProgramTransformer = (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

interface Sources {
  /**
   * This is the root file for the transform.
   */
  index: string;
  [key: string]: string;
}

/**
 * This creates a full project which will resolve all modules.
 * Only use this when wanting to test imports tbh. It's slow.
 */
export const createFullTransform = (programTransformer: ProgramTransformer) => (
  sources: Sources
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const memfs = Volume.fromJSON(
      Object.entries(sources).reduce<Record<string, string>>(
        (acc, [name, content]) => ({
          ...acc,
          [`/${name}.tsx`]: content,
        }),
        {}
      )
    ) as IFs;

    // Create mock "@untitled/css-in-js-project"
    createMockModule(pkg.name, memfs);

    const config: ts.CompilerOptions = {
      jsx: ts.JsxEmit.Preserve,
      lib: ['/node_modules/typescript/lib/lib.esnext.full.d.ts'],
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      suppressImplicitAnyIndexErrors: true,
      resolveJsonModule: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ESNext,
      types: [],
      // Uncomment this if shit isn't working.
      // noEmitOnError: true,
    };

    const compilerHost = ts.createCompilerHost(config, true);

    copy(
      { fs: Fs, path: compilerHost.getDefaultLibLocation!() },
      { fs: memfs, path: '/node_modules/typescript/lib/' }
    );

    compilerHost.getDefaultLibLocation = () => '/node_modules/typescript/lib/';

    compilerHost.fileExists = file => memfs.existsSync(file);

    compilerHost.resolveModuleNames = (names, containingFile) => {
      return names.map(name => {
        return {
          resolvedFileName: resolveModule.sync(name, {
            basedir: path.dirname(containingFile),
            extensions: ['.js', '.json', '.node', '.tsx', '.ts', '.d.ts'],
            readFileSync: path => memfs.readFileSync(path),
            isFile: (name: string) => {
              try {
                return memfs.statSync(name).isFile();
              } catch (err) {
                return false;
              }
            },
            isDirectory: (name: string) => {
              try {
                return memfs.statSync(name).isDirectory();
              } catch (err) {
                return false;
              }
            },
          }),
        };
      });
    };

    compilerHost.getSourceFile = (filename, version) => {
      return ts.createSourceFile(
        filename,
        String(memfs.readFileSync(path.join('/', `${filename}`))),
        version
      );
    };

    compilerHost.writeFile = (filename, data) => {
      mkdirp({ fs: memfs, path: path.dirname(filename) });
      memfs.writeFileSync(filename, data);
    };

    const program = ts.createProgram(['/index.tsx'], config, compilerHost);

    const { emitSkipped, diagnostics, emittedFiles } = program.emit(
      undefined,
      (filename, data) => {
        if (filename.endsWith('index.jsx')) {
          resolve(data);
        }
      },
      undefined,
      false,
      {
        before: [programTransformer(program)],
      }
    );

    if (emitSkipped) {
      return reject(new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n')));
    }

    if (!emittedFiles) {
      return reject(new Error('Nothing was emitted'));
    }
  });
};

export const createTransform = (programTransformer: ProgramTransformer) => (
  source: string
): string => {
  const transformer = programTransformer({} as any);
  const sourceFile = ts.createSourceFile('index.tsx', source, ts.ScriptTarget.Latest, true);
  const actual = ts.transform(sourceFile, [transformer]).transformed[0];
  return printer.printFile(actual).toString();
};
