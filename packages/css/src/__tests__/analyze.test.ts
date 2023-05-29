import { analyze } from '../analyze';

describe('analyze', () => {
  it('should report the total number of CSS rules', () => {
    const report = analyze(`
            .a {
                justify-self: end;
            }
            .b {
                margin-left: auto;
            }
            .c {
                display: flex;
            }
        `);
    expect(report.total).toBe(3);
  });

  it('should detect rules that have nested selectors', () => {
    const report = analyze(`
            .a .b{
                justify-self: end;
            }
            .a>.b{
                display: flex;
            }
        `);
    expect(report.hasNestedSelector).toBe(2);
  });

  it('should detect rules that use CSS variables', () => {
    const report = analyze(`
            .a{
               color: var(--primary)
            }
        `);
    expect(report.hasVariable).toBe(1);
  });

  it('should detect rules that use inline image', () => {
    const report = analyze(`
            .a{
               background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGl);
            }
        `);
    expect(report.hasInlineImage).toBe(1);
  });
});
