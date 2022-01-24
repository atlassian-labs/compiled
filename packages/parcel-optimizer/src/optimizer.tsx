import { sort } from '@compiled/css';
import { Optimizer } from '@parcel/plugin';

export default new Optimizer({
  async optimize({ contents, map }) {
    return { contents: sort(contents.toString()), map };
  },
});
