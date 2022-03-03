import convert from 'convert-source-map';
import { SourceMapGenerator } from 'source-map';

/**
 * Used to generate a inline source map for CSS.
 * It's input is the TypeScript source file,
 * an offset (where we should place the cursor when jumping to the source map)
 * and TypeScript context.
 *
 * Will return something like `/*# sourceMappingURL=...`
 */
export function buildSourceMap(
  offset: {
    line: number;
    character: number;
  },
  code: string,
  fileName: string,
  sourceRoot?: string
): string {
  const generator = new SourceMapGenerator({
    file: fileName,
    sourceRoot,
  });

  generator.setSourceContent(fileName, code);
  generator.addMapping({
    generated: {
      column: 0,
      line: 1,
    },
    original: {
      column: offset.character,
      line: offset.line + 1,
    },
    source: fileName,
  });

  return convert.fromObject(generator).toComment({ multiline: true });
}
