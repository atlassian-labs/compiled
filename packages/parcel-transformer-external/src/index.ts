import { join, dirname, isAbsolute } from 'path';

import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';

function findTargetSourcePositions(source: string, regex: RegExp) {
  const lines = source.split('\n');

  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.matchAll(regex);

    for (const match of matches) {
      if (match && match.index != null) {
        results.push({
          source: match[0],
          groups: match.groups,
          line: i,
          column: match.index,
        });
      }
    }
  }

  return results;
}

export default new Transformer({
  async transform({ asset, options }) {
    let code = await asset.getCode();

    if (code.indexOf('.compiled.css') < 0) {
      // Early exit if no relevant files
      return [asset];
    }

    let map = await asset.getMap();
    for (const match of findTargetSourcePositions(
      code,
      /(import ['"](?<importSpec>.+\.compiled\.css)['"];)|(require\(['"](?<requireSpec>.+\.compiled\.css)['"]\);)/g
    )) {
      const specifierPath = match.groups?.importSpec || match.groups?.requireSpec;
      if (!specifierPath) continue;

      if (options.env.sourceMap) {
        if (!map) map = new SourceMap(options.projectRoot);

        map.offsetColumns(match.line + 1, match.column + match.source.length, -match.source.length);
      }

      code = code.replace(match.source, '');

      const cssFilePath = isAbsolute(specifierPath)
        ? specifierPath
        : join(dirname(asset.filePath), specifierPath);

      const cssContent = (await asset.fs.readFile(cssFilePath)).toString().split('\n');
      if (!asset.meta.styleRules) {
        asset.meta.styleRules = [];
      }
      (asset.meta.styleRules as string[]).push(...cssContent);
    }

    asset.setCode(code);

    if (map) {
      asset.setMap(map);
    }

    return [asset];
  },
});
