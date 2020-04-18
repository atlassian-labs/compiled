import * as ts from 'typescript';
import { SourceMapGenerator } from 'source-map';
import convert from 'convert-source-map';

export function getSourceMap(
  offset: {
    line: number;
    column: number;
  },
  sourceFile: ts.SourceFile
): string {
  const generator = new SourceMapGenerator({
    file: sourceFile.fileName,
  });

  generator.setSourceContent(sourceFile.fileName, sourceFile.getText());
  generator.addMapping({
    generated: {
      line: 1,
      column: 0,
    },
    source: sourceFile.fileName,
    original: offset,
  });

  return convert.fromObject(generator).toComment({ multiline: true });
}
