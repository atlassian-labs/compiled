import { getStyleBucketName } from '../sheet';

/**
 * Sheets below are real `transformCss()` output.
 *
 * - Legacy hash: 9-char classes (`_` + 4-char group + 4-char value)
 * - Collision-resistant hash: 11-char classes (`_` + 6-char group + 4-char value)
 *
 */
describe('getStyleBucketName', () => {
  describe('legacy hash (9-char class names)', () => {
    it.each([
      ['link', '._ysv75scu:link{color:red}', 'l'],
      ['visited', '._10535scu:visited{color:red}', 'v'],
      ['focus-within', '._vp7g5scu:focus-within{color:red}', 'w'],
      ['focus', '._f8pj5scu:focus{color:red}', 'f'],
      ['focus-visible', '._v0vw5scu:focus-visible{color:red}', 'i'],
      ['hover', '._30l35scu:hover{color:red}', 'h'],
      ['active', '._9h8h5scu:active{color:red}', 'a'],
    ])('buckets :%s', (_, sheet, expected) => {
      expect(getStyleBucketName(sheet)).toEqual(expected);
    });

    it('prefers the pseudo bucket over the shorthand bucket', () => {
      expect(getStyleBucketName('._19it107e{border:1px solid red}')).toEqual('s-1');
      expect(getStyleBucketName('._bfw7107e:hover{border:1px solid red}')).toEqual('h');
    });

    it('buckets a trailing pseudo of a compound selector, matching the build-time sort', () => {
      // `sort-pseudo-selectors.ts` scores on the trailing pseudo (`endsWith`),
      // so `:hover:focus` must land in the focus bucket — not catch-all.
      expect(getStyleBucketName('._z1ku5scu:hover:focus{color:red}')).toEqual('f');
    });

    it.each([
      ['a plain declaration', '._syaz5scu{color:red}'],
      ['an unmapped pseudo element', '._1kt91x3x:before{content:"a"}'],
    ])('falls back to the catch-all bucket for %s', (_, sheet) => {
      expect(getStyleBucketName(sheet)).toEqual('');
    });

    it('buckets shorthand properties by depth', () => {
      expect(getStyleBucketName('._19it107e{border:1px solid red}')).toEqual('s-1');
    });

    it('buckets at-rules', () => {
      expect(getStyleBucketName('@media screen{._30l35scu:hover{color:red}}')).toEqual('m');
    });
  });

  describe('collision-resistant hash (11-char class names)', () => {
    it.each([
      ['link', '._2ipzJpGowl:link{color:red}', 'l'],
      ['visited', '._2nTuUYGowl:visited{color:red}', 'v'],
      ['focus-within', '._25IEJJGowl:focus-within{color:red}', 'w'],
      ['focus', '._10n1R5Gowl:focus{color:red}', 'f'],
      ['focus-visible', '._22XfGnGowl:focus-visible{color:red}', 'i'],
      ['hover', '._0clgaMGowl:hover{color:red}', 'h'],
      ['active', '._0CMRbkGowl:active{color:red}', 'a'],
    ])('buckets :%s', (_, sheet, expected) => {
      expect(getStyleBucketName(sheet)).toEqual(expected);
    });

    it('prefers the pseudo bucket over the shorthand bucket', () => {
      expect(getStyleBucketName('._30huDK9HCG{border:1px solid red}')).toEqual('s-1');
      expect(getStyleBucketName('._0KOPe29HCG:hover{border:1px solid red}')).toEqual('h');
    });

    it('buckets a trailing pseudo of a compound selector, matching the build-time sort', () => {
      expect(getStyleBucketName('._2joYD5Gowl:hover:focus{color:red}')).toEqual('f');
    });

    it.each([
      ['a plain declaration', '._1UtDYzGowl{color:red}'],
      ['an unmapped pseudo element', '._3Ku51IR2KL:before{content:"a"}'],
    ])('falls back to the catch-all bucket for %s', (_, sheet) => {
      expect(getStyleBucketName(sheet)).toEqual('');
    });

    it('buckets shorthand properties by depth', () => {
      expect(getStyleBucketName('._30huDK9HCG{border:1px solid red}')).toEqual('s-1');
    });

    it('buckets at-rules', () => {
      expect(getStyleBucketName('@media screen{._0clgaMGowl:hover{color:red}}')).toEqual('m');
    });
  });
});
