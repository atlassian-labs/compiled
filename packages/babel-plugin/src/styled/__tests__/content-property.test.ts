import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('handling of values for CSS `content` property', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  // Tests are based on those covered by vanilla-extract, credit goes to them :)
  //
  // https://github.com/vanilla-extract-css/vanilla-extract/blob/a623c1c65a543afcedb9feb30a7fe20452b99a95/packages/css/src/transformCss.test.ts#L639

  it('should handle blank content', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: '',
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4ogpp{content:""}');
  });

  it('should handle blank content (variant #1)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: \`\`,
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4ogpp{content:""}');
  });

  it('should handle blank content (variant #2)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const hello = '';
      const ListItem = styled.div({
        content: \`\${hello}\`,
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4ogpp{content:""}');
  });

  it('should handle blank content (variant #2)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const hello = 'this is a string';
      const ListItem = styled.div({
        content: hello,
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4phYs{content:"this is a string"}');
  });

  it('should add quotes to custom content values', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: 'hello',
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4z2Y9{content:"hello"}');
  });

  it('should not add quotes if they exist already', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: "'hello'",
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain("._4f9mo4qHCK{content:'hello'}");
  });

  it('should not add quotes if they exist already (variant)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: '"hello"',
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._4f9mo4z2Y9{content:"hello"}');
  });

  it("should not add quotes to content values that shouldn't accept them", () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        '._01 &': { content: 'none' },
        '._02 &': { content: 'url("http://www.example.com/test.png")' },
        '._03 &': { content: 'linear-gradient(#e66465, #9198e5)' },
        '._04 &': {
          content: 'image-set("image1x.png" 1x, "image2x.png" 2x)',
        },
        '._05 &': {
          content:
            'url("http://www.example.com/test.png") / "This is the alt text"',
        },
        '._06 &': { content: '"prefix"' },
        '._07 &': { content: 'counter(chapter_counter)' },
        '._08 &': { content: 'counter(chapter_counter, upper-roman)' },
        '._09 &': { content: 'counters(section_counter, ".")' },
        '._10 &': {
          content:
            'counters(section_counter, ".", decimal-leading-zero)',
        },
        '._11 &': { content: 'attr(value string)' },
        '._12 &': { content: 'open-quote' },
        '._13 &': { content: 'close-quote' },
        '._14 &': { content: 'no-open-quote' },
        '._15 &': { content: 'no-close-quote' },
        '._16 &': { content: 'open-quote counter(chapter_counter)' },
        '._17 &': { content: 'inherit' },
        '._18 &': { content: 'initial' },
        '._19 &': { content: 'revert' },
        '._20 &': { content: 'unset' },
      });
    `;

    const actual = transform(code, { pretty: true });
    const expectedStrings = [
      '._20 ._0UeemBZqHV{content:unset}',
      '._19 ._1nMWnyDHe6{content:revert}',
      '._18 ._1DYWSVyL8i{content:initial}',
      '._17 ._3hffmTOLYo{content:inherit}',
      '._16 ._2TT1EYhMVv{content:open-quote counter(chapter_counter)}',
      '._15 ._2BvCKXI4D5{content:no-close-quote}',
      '._14 ._3urm9xWkBK{content:no-open-quote}',
      '._13 ._3lLWKajuZP{content:close-quote}',
      '._12 ._2j7U2ZUvkW{content:open-quote}',
      '._11 ._4hqdKsfirL{content:attr(value string)}',
      '._10 ._2tBJ3btuW2{content:counters(section_counter,".",decimal-leading-zero)}',
      '._09 ._4socCz4UE8{content:counters(section_counter,".")}',
      '._08 ._1W2j05cjsh{content:counter(chapter_counter,upper-roman)}',
      '._07 ._3rjrnPKr1F{content:counter(chapter_counter)}',
      '._06 ._0icKuuYu2d{content:"prefix"}',
      '._05 ._2q3Vi0uOJ8{content:url("http://www.example.com/test.png") /"This is the alt text"}',
      '._04 ._2w3quqh0cj{content:image-set("image1x.png" 1x,"image2x.png" 2x)}',
      '._03 ._1KrS9whwQU{content:linear-gradient(#e66465,#9198e5)}',
      '._02 ._3snqGkpO9r{content:url("http://www.example.com/test.png")}',
      '._01 ._4f5dQzYbGa{content:none}',
    ];

    for (const expected of expectedStrings) {
      expect(actual).toContain(expected);
    }
  });
});
