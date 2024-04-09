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
    expect(actual).toContain('._1sb2b3bt{content:""}');
  });

  it('should handle blank content (variant #1)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: \`\`,
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._1sb2b3bt{content:""}');
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
    expect(actual).toContain('._1sb2b3bt{content:""}');
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
    expect(actual).toContain('._1sb21icm{content:"this is a string"}');
  });

  it('should add quotes to custom content values', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: 'hello',
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._1sb21e8g{content:"hello"}');
  });

  it('should not add quotes if they exist already', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: "'hello'",
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain("._1sb25hbz{content:'hello'}");
  });

  it('should not add quotes if they exist already (variant)', () => {
    const code = `
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        content: '"hello"',
      });
    `;

    const actual = transform(code, { pretty: true });
    expect(actual).toContain('._1sb21e8g{content:"hello"}');
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
      '._20 ._dqocn7od{content:unset}',
      '._19 ._kyq719ly{content:revert}',
      '._18 ._ox6v18uv{content:initial}',
      '._17 ._1do11kw7{content:inherit}',
      '._16 ._17yjbbkt{content:open-quote counter(chapter_counter)}',
      '._15 ._13gv16xt{content:no-close-quote}',
      '._14 ._1gw4qmeg{content:no-open-quote}',
      '._13 ._1erv1lzr{content:close-quote}',
      '._12 ._yz5n12u0{content:open-quote}',
      '._11 ._1sv1f7m1{content:attr(value string)}',
      '._10 ._11jd1td3{content:counters(section_counter,".",decimal-leading-zero)}',
      '._09 ._1vjjgvpy{content:counters(section_counter,".")}',
      '._08 ._tc0r17sh{content:counter(chapter_counter,upper-roman)}',
      '._07 ._1g4mlfyt{content:counter(chapter_counter)}',
      '._06 ._4g5v1dlo{content:"prefix"}',
      '._05 ._10o677hy{content:url("http://www.example.com/test.png") /"This is the alt text"}',
      '._04 ._124v19iq{content:image-set("image1x.png" 1x,"image2x.png" 2x)}',
      '._03 ._qi2v1f55{content:linear-gradient(#e66465,#9198e5)}',
      '._02 ._1gdz1dgq{content:url("http://www.example.com/test.png")}',
      '._01 ._1sagglyw{content:none}',
    ];

    for (const expected of expectedStrings) {
      expect(actual).toContain(expected);
    }
  });
});
