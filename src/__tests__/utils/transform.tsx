import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const printer = ts.createPrinter();

type ProgramTransformer = (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

/**
 * This creates a full project which will resolve all modules.
 * Only use this when wanting to test imports tbh. It's slow.
 */
export const createFullTransform = (
  programTransformer: ProgramTransformer,
  dir: string
) => (sources: {
  /**
   * This is the root file for the transform.
   */
  index: string;
  [key: string]: string;
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      fs.rmdirSync(`${dir}/.tmp`, { recursive: true });
    } catch {}

    fs.mkdirSync(`${dir}/.tmp`);
    const files: string[] = [];
    Object.keys(sources).forEach(key => {
      const source = sources[key];
      const filename = `${key}.tsx`;
      const filepath = path.resolve(`${dir}/.tmp/${filename}`);
      files.push(filepath);
      fs.writeFileSync(filepath, source);
    });

    const [rootFile] = files;
    const config: ts.CompilerOptions = {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      suppressImplicitAnyIndexErrors: true,
      target: ts.ScriptTarget.ESNext,
      // Uncomment this if shit isn't working.
      // noEmitOnError: true,
    };
    const compilerHost = ts.createCompilerHost(config, true);
    const program = ts.createProgram([rootFile], config, compilerHost);

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
