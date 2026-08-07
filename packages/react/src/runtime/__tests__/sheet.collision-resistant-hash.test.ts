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

    it.each([
      ['a plain declaration', '._1UtDYzGowl{color:red}'],
      ['a longhand (non-shorthand) property', '._3zygPUGowl{border-top-color:red}'],
      ['an unmapped pseudo element', '._3Ku51IR2KL:before{content:"a"}'],
      // Compound selectors slice an unmapped fragment from the fixed offset
      // (`"ited:hover"`, `"er:focus"`), so they land in the catch-all bucket.
      ['a compound pseudo selector', '._2rRmYxGowl:hover:focus{color:red}'],
      ['a compound visited+hover selector', '._1pa1v9Gowl:visited:hover{color:red}'],
      ['a compound visited+active selector', '._2cC3KHGowl:visited:active{color:red}'],
    ])('falls back to the catch-all bucket for %s', (_, sheet) => {
      expect(getStyleBucketName(sheet)).toEqual('');
    });

    it.each([
      ['all', '._1mb4UnZqHV{all:unset}', 's-0'],
      ['border', '._30huDK9HCG{border:1px solid red}', 's-1'],
      ['margin-inline', '._2YLqiKdnbC{margin-inline:0}', 's-2'],
      ['border-block', '._029LLI9HCG{border-block:1px solid red}', 's-3'],
      ['border-top', '._2bqfgd9HCG{border-top:1px solid red}', 's-4'],
      ['border-block-start', '._1v3aPq9HCG{border-block-start:1px solid red}', 's-5'],
    ])('buckets the shorthand %s by depth', (_, sheet, expected) => {
      expect(getStyleBucketName(sheet)).toEqual(expected);
    });

    it('buckets at-rules into m', () => {
      expect(getStyleBucketName('@media screen{._0AhSnbGowl:hover{color:red}}')).toEqual('m');
    });
  });
});
