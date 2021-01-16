import { Transformer } from '@parcel/plugin';
import semver from 'semver';

export default new Transformer({
  async loadConfig(_: any) {},

  canReuseAST({ ast }: any) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async transform(_: any) {
    console.log(_);
  },
});
