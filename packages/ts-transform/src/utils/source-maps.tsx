import * as ts from 'typescript';
import { SourceMapGenerator } from 'source-map';
import convert from 'convert-source-map';
import path from 'path';

const getFileName = (sourceFile: ts.SourceFile): string => {
  return path.basename(sourceFile.fileName);
};

/**
 * Used to generate a inline source map for CSS.
 * It's input is the TypeScript source file,
 * an offset (where we should place the cursor when jumping to the source map)
 * and TypeScript context.
 *
 * Will return something like `/*# sourceMappingURL=...`
 */
export function getSourceMap(
  offset: {
    line: number;
    character: number;
  },
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext
): string {
  const fileName = getFileName(sourceFile);
  const generator = new SourceMapGenerator({
    file: fileName,
    sourceRoot: context.getCompilerOptions().sourceRoot,
  });

  generator.setSourceContent(fileName, sourceFile.getFullText());
  generator.addMapping({
    generated: {
      line: 1,
      column: 0,
    },
    source: fileName,
    original: {
      line: offset.line + 1,
      column: offset.character,
    },
  });

  return convert.fromObject(generator).toComment({ multiline: true });
}
