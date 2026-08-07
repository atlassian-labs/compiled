import { getStyleBucketName } from '../sheet';

/**
 * CHARACTERIZATION TESTS — these pin the CURRENT behavior of `getStyleBucketName`,
 * warts and all, before any fix. The point is that a later change to the algorithm
 * shows up here as an explicit assertion diff, so nothing changes silently.
 *
 * This first iteration focuses on the legacy 9-char hash only. The current
 * implementation assumes a fixed 9-char atomic class (`_` + 4-char group + 4-char
 * value) and reads the pseudo at a fixed offset (index 10, slice from 14).
 *
 * Sheets below are real `transformCss()` output.
 */
describe('getStyleBucketName (characterization of current behavior)', () => {
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

    it.each([
      ['a plain declaration', '._syaz5scu{color:red}'],
      ['a longhand (non-shorthand) property', '._6k7l0000{border-top-color:red}'],
      ['an unmapped pseudo element', '._1kt91x3x:before{content:"a"}'],
      // Compound selectors slice an unmapped fragment from the fixed offset
      // (`"ited:hover"`, `"er:focus"`), so they land in the catch-all bucket.
      ['a compound pseudo selector', '._z1ku5scu:hover:focus{color:red}'],
      ['a compound visited+hover selector', '._10535scu:visited:hover{color:red}'],
      ['a compound visited+active selector', '._1vhv17z1:visited:active{color:red}'],
    ])('falls back to the catch-all bucket for %s', (_, sheet) => {
      expect(getStyleBucketName(sheet)).toEqual('');
    });

    it.each([
      ['all', '._1a2b0000{all:unset}', 's-0'],
      ['border', '._19it107e{border:1px solid red}', 's-1'],
      ['margin-inline', '._2c3d0000{margin-inline:0}', 's-2'],
      ['border-block', '._3e4f0000{border-block:1px solid red}', 's-3'],
      ['border-top', '._4g5h0000{border-top:1px solid red}', 's-4'],
      ['border-block-start', '._5i6j0000{border-block-start:1px solid red}', 's-5'],
    ])('buckets the shorthand %s by depth', (_, sheet, expected) => {
      expect(getStyleBucketName(sheet)).toEqual(expected);
    });

    it('buckets at-rules into m', () => {
      expect(getStyleBucketName('@media screen{._30l35scu:hover{color:red}}')).toEqual('m');
    });
  });
});
