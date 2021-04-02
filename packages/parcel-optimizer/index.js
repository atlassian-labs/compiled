const { Optimizer } = require('@parcel/plugin');
const { sort } = require('@compiled/css');

module.exports = new Optimizer({
  async optimize({ contents, map }) {
    return { contents: sort(contents), map };
  },
});
