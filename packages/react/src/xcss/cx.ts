import type { XCSSProp } from './xcss';

const cx = <Collection extends [...XCSSProp<any, any>[]]>(
  ..._css: Collection
): Collection[number] => {
  throw new Error('invariant');
};

export default cx;
