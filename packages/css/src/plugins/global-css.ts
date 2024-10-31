import { hash } from '@compiled/utils';
import { type Plugin, rule } from 'postcss';

interface PluginOpts {
  callback?: (className: string) => void;
}

export const groupGlobalRules = ({ callback }: PluginOpts): Plugin => {
  return {
    postcssPlugin: 'group-global-rules',

    OnceExit(root) {
      // @ts-ignore
      const uniqueName = '_' + hash(root.source?.input.css);
      const nodes = [];
      // @ts-ignore
      const orphanDecls = [];
      callback && callback(uniqueName);

      root.each((node) => {
        switch (node.type) {
          // TODO: handle atRules case
          case 'decl':
            orphanDecls.push(node);
            break;

          case 'rule':
            nodes.push(
              node.clone({
                selector: `.${uniqueName} ${node.selector}`,
              })
            );
            break;

          case 'comment':
            node.remove();
            break;

          default:
            break;
        }
      });

      if (orphanDecls.length) {
        console.log('orphanDecls', orphanDecls);
        nodes.unshift(
          rule({
            raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
            // @ts-ignore
            nodes: orphanDecls,
            selector: '.' + uniqueName,
          })
        );
      }

      root.nodes = nodes;
    },
  };
};

export const postcss = true;
