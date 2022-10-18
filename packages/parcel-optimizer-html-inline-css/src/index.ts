import assert from 'assert';

import { sort } from '@compiled/css';
import { Optimizer } from '@parcel/plugin';
import posthtml from "posthtml";
import { insertAt } from "posthtml-insert-at";

export default new Optimizer({
  async optimize({ contents, map, bundleGraph }) {
    const styleRules: string[] = [];

    for (const bundle of bundleGraph.getBundles()) {
      bundle.traverseAssets((asset) => {
        const rules = asset.meta.styleRules;
        if (rules == null) {
          return;
        }

        assert(rules instanceof Array);

        for (const rule of rules) {
          styleRules.push(rule as string);
        }
      });
    }

    if (styleRules.length === 0) return  { contents, map };

    const stylesheet = sort(styleRules.join(''));

    const newContents = await posthtml()
      .use(
        insertAt({
          selector: "head",
          append: '<style>'+ stylesheet + '</style>',
          behavior: "inside",
        })
      )
      .process(contents.toString())

    return { contents: newContents.html, map };
  },
});
