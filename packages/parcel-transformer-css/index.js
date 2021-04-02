const { Transformer } = require('@parcel/plugin');

module.exports = new Transformer({
  async transform({ asset }) {
    asset.setCode(asset.query.style || '');
    asset.isSplittable = false;
    return [asset];
  },

  async generate({ asset }) {
    return { content: asset.getCode() };
  },
});
