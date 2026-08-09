import { getStyleBucketName } from '../sheet';

/**
 * This suite mirrors the established legacy-hash characterization with
 * collision-resistant 11-char atomic classes. Expected buckets originate in the
 * legacy suite, which records the pre-#1930 runtime contract; this suite proves
 * that changing hash width does not change that contract.
 */
describe('getStyleBucketName (collision-resistant hash compatibility)', () => {
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

    it.each([
      ['a plain declaration', '._1UtDYzGowl{color:red}'],
      ['a longhand (non-shorthand) property', '._3zygPUGowl{border-top-color:red}'],
      ['an unmapped pseudo element', '._3Ku51IR2KL:before{content:"a"}'],
      // These expectations mirror the pre-#1930 legacy contract: only pseudos
      // immediately following the atomic class receive a pseudo bucket.
      ['an attribute-qualified selector', '._1UtDYzGowl[data-selector]{color:red}'],
      ['an attribute-qualified pseudo selector', '._0clgaMGowl[data-selector]:hover{color:red}'],
      // Compound selectors slice an unmapped fragment from the fixed offset
      // (`"ited:hover"`, `"er._2rRmYxGowl:focus"`), so they land in the catch-all bucket.
      ['a compound pseudo selector', '._2rRmYxGowl:hover:focus{color:red}'],
      ['a transformed compound pseudo selector', '._2rRmYxGowl:hover._2rRmYxGowl:focus{color:red}'],
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
