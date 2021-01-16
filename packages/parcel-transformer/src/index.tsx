import { Transformer } from '@parcel/plugin';
import semver from 'semver';

console.log('hmmm');

export default new Transformer({
  async loadConfig(_: any) {},

  canReuseAST({ ast }: any) {
    console.log(ast);
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async transform(_: any) {
    console.log(_);
  },
});
