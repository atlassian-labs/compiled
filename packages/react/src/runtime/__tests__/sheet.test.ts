import { getStyleBucketName } from '../sheet.js';

describe('getStyleBucketName', () => {
  describe('atomic rules (_-prefixed)', () => {
    it('should return catch-all bucket for simple atomic rule', () => {
      expect(getStyleBucketName('._syaz5scu{color:red}')).toBe('');
    });

    it('should return shorthand bucket s-1 for background shorthand', () => {
      expect(getStyleBucketName('._bfhk5scu{background:red}')).toBe('s-1');
    });

    it('should return shorthand bucket s-4 for border-bottom shorthand', () => {
      expect(getStyleBucketName('._abc12345{border-bottom:2px solid transparent}')).toBe('s-4');
    });

    it('should return pseudo bucket for :hover', () => {
      expect(getStyleBucketName('._syaz5scu:hover{color:red}')).toBe('h');
    });

    it('should return media bucket for @media', () => {
      expect(getStyleBucketName('@media (min-width:768px){._syaz5scu{color:red}}')).toBe('m');
    });
  });

  describe('non-atomic rules (cc- prefixed)', () => {
    it('should return catch-all bucket "" for a simple non-atomic rule', () => {
      // Even though the first property is color (non-shorthand), cc- rules go to catch-all
      expect(getStyleBucketName('.cc-aojfb{color:red}')).toBe('');
    });

    it('should return catch-all bucket "" even when first property is a shorthand', () => {
      // This is the critical fix: border-bottom is shorthand depth 4, but cc- rules
      // must NOT go into s-4 bucket — they contain multiple declarations and the
      // shorthand bucket logic only works correctly for single-property atomic rules.
      expect(
        getStyleBucketName(
          '.cc-1vlc911 .ProseMirror .ak-editor-annotation-blur,.cc-1vlc911 .ProseMirror .ak-editor-annotation-focus{border-bottom:2px solid transparent;cursor:pointer}'
        )
      ).toBe('');
    });

    it('should return catch-all bucket "" when first property is background shorthand', () => {
      // background is shorthand depth 1 — without the fix, this would return 's-1'
      expect(getStyleBucketName('.cc-2ax5o6 .panel{background:blue;padding:8px}')).toBe('');
    });

    it('should return catch-all bucket "" for a nested selector non-atomic rule', () => {
      expect(
        getStyleBucketName(
          '.cc-1vlc911 .ProseMirror .ak-editor-annotation-focus{background:yellow;border-bottom-color:orange}'
        )
      ).toBe('');
    });

    it('should return media bucket "m" for @media wrapping a cc- rule', () => {
      // @media rules still go to the media bucket regardless of inner cc- content
      expect(getStyleBucketName('@media (min-width:768px){.cc-ysa2s9{width:50%}}')).toBe('m');
    });

    it('should not confuse cc- with atomic rules starting with c', () => {
      // A hypothetical atomic rule whose class starts with "c" should NOT be treated as cc-
      // (atomic class names use _ prefix, so this case shouldn't occur in practice)
      expect(getStyleBucketName('._c1234567{color:red}')).toBe('');
    });
  });
});
