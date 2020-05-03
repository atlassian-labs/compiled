import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import rootTransformer from '../index';

const stubProgam: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

const createTsConfig = (
  transformer: ts.TransformerFactory<ts.SourceFile>,
  overrides: ts.CompilerOptions = {}
): ts.TranspileOptions => ({
  transformers: { before: [transformer] },
  compilerOptions: {
    module: ts.ModuleKind.ES2015,
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.ESNext,
    ...overrides,
  },
});

describe('root transformer', () => {
  it('should not blow up when transforming with const', () => {
    const transformer = rootTransformer(stubProgam, {});

    expect(() => {
      ts.transpileModule(
        `
          import '@compiled/css-in-js';
          import React from 'react';
          const MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        createTsConfig(transformer)
      );
    }).not.toThrow();
  });

  it('should not blow up when transforming with var', () => {
    const transformer = rootTransformer(stubProgam, {});

    expect(() => {
      ts.transpileModule(
        `
          import '@compiled/css-in-js';
          import React from 'react';
          var MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        createTsConfig(transformer)
      );
    }).not.toThrow();
  });

  it('should not blow up when consuming an import', () => {
    const transformer = new Transformer()
      .addTransformer(rootTransformer)
      .setFilePath('/index.tsx')
      .addMock({ name: 'react', content: `export default null;` })
      .addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'blue' };",
      });

    expect(() => {
      transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ ':hover': mixin }}>hello</div>
      `);
    }).not.toThrow();
  });

  it('should generate source maps for a css prop', () => {
    const transformer = rootTransformer(stubProgam, { options: { sourceMap: true } });

    const actual = ts.transpileModule(
      `
        import '@compiled/css-in-js';
        <div css={{ fontSize: '20px' }}>hello world</div>
      `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      <CC><CS hash=\\"1b1wq3m\\">{[\\".cc-1b1wq3m{font-size:20px}\\\\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRVEiLCJmaWxlIjoibW9kdWxlLnRzeCIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgICAgICBpbXBvcnQgJ0Bjb21waWxlZC9jc3MtaW4tanMnO1xuICAgICAgICA8ZGl2IGNzcz17eyBmb250U2l6ZTogJzIwcHgnIH19PmhlbGxvIHdvcmxkPC9kaXY+XG4gICAgICAiXX0= */\\"]}</CS><div className=\\"cc-1b1wq3m\\">hello world</div></CC>;
      "
    `);
  });

  it('should generate source maps for a styled component', () => {
    const transformer = rootTransformer(stubProgam, { options: { sourceMap: true } });

    const actual = ts.transpileModule(
      `
        import { styled } from '@compiled/css-in-js';

        styled.div({ fontSize: 20 });
      `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      /*#__PURE__*/ React.forwardRef(({ as: C = \\"div\\", ...props }, ref) => <CC><CS hash=\\"1b1wq3m\\">{[\\".cc-1b1wq3m{font-size:20px}\\\\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR1EiLCJmaWxlIjoibW9kdWxlLnRzeCIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgICAgICBpbXBvcnQgeyBzdHlsZWQgfSBmcm9tICdAY29tcGlsZWQvY3NzLWluLWpzJztcblxuICAgICAgICBzdHlsZWQuZGl2KHsgZm9udFNpemU6IDIwIH0pO1xuICAgICAgIl19 */\\"]}</CS><C {...props} ref={ref} className={\\"cc-1b1wq3m\\" + (props.className ? \\" \\" + props.className : \\"\\")}/></CC>);
      "
    `);
  });

  it('should generate source maps for a class names component', () => {
    const transformer = rootTransformer(stubProgam, { options: { sourceMap: true } });

    const actual = ts.transpileModule(
      `
        import { ClassNames } from '@compiled/css-in-js';

        <ClassNames>{({ css }) => <div className={css({ fontSize: 20 })} />}</ClassNames>
      `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      <CC><CS hash=\\"gpurwr\\">{[\\".cc-1b1wq3m{font-size:20px}\\\\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR1EiLCJmaWxlIjoibW9kdWxlLnRzeCIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgICAgICBpbXBvcnQgeyBDbGFzc05hbWVzIH0gZnJvbSAnQGNvbXBpbGVkL2Nzcy1pbi1qcyc7XG5cbiAgICAgICAgPENsYXNzTmFtZXM+eyh7IGNzcyB9KSA9PiA8ZGl2IGNsYXNzTmFtZT17Y3NzKHsgZm9udFNpemU6IDIwIH0pfSAvPn08L0NsYXNzTmFtZXM+XG4gICAgICAiXX0= */\\"]}</CS><div className={\\"cc-1b1wq3m\\"}/></CC>;
      "
    `);
  });

  it('should only import Style once', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
        import { styled } from '@compiled/css-in-js';

        const StyledDiv = styled.div({});
        <div css={{ fontSize: '20px' }}>hello world</div>
      `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toInclude('import { CC, CS } from "@compiled/style"');
  });

  it('should match react import when transforming to common js', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
        import React from 'react';
        import '@compiled/css-in-js';
        <div css={{ fontSize: '20px' }}>hello world</div>
      `,
      createTsConfig(transformer, { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React })
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "\\"use strict\\";
      Object.defineProperty(exports, \\"__esModule\\", { value: true });
      const react_1 = require(\\"react\\");
      const style_1 = require(\\"@compiled/css-in-js\\");
      react_1.default.createElement(style_1.CC, null,
          react_1.default.createElement(style_1.CS, { hash: '1b1wq3m' }, [\\".cc-1b1wq3m{font-size:20px}\\"]),
          react_1.default.createElement(\\"div\\", { className: 'cc-1b1wq3m' }, \\"hello world\\"));
      "
    `);
  });

  it('should minify the css', () => {
    const transformer = rootTransformer(stubProgam, { options: { minify: true } });

    const actual = ts.transpileModule(
      `
      import { styled } from '@compiled/css-in-js';

      styled.div\`
        font-size: 12px;
        color: blue;
      \`;
    `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toInclude('.cc-1rl8k7o{color:#00f;font-size:9pt}');
  });

  it('should not change code where there is no compiled components', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
      const one = 1;
    `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "const one = 1;
      "
    `);
  });

  it('should transform a styled component', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
      import { styled } from '@compiled/css-in-js';

      styled.div\`
        font-size: 12px;
      \`;
    `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      /*#__PURE__*/ React.forwardRef(({ as: C = \\"div\\", ...props }, ref) => <CC><CS hash=\\"1x3e11p\\">{[\\".cc-1x3e11p{font-size:12px}\\"]}</CS><C {...props} ref={ref} className={\\"cc-1x3e11p\\" + (props.className ? \\" \\" + props.className : \\"\\")}/></CC>);
      "
    `);
  });

  it('should transform css prop', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
      import '@compiled/css-in-js';

      <div css={{ fontSize: 12 }} />
    `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      <CC><CS hash=\\"1iqe21w\\">{[\\".cc-1iqe21w{font-size:12px}\\"]}</CS><div className=\\"cc-1iqe21w\\"/></CC>;
      "
    `);
  });

  it('should transform classnames component', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
      import { ClassNames } from '@compiled/css-in-js';

      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    `,
      createTsConfig(transformer)
    );

    expect(actual.outputText).toMatchInlineSnapshot(`
      "import React from \\"react\\";
      import { CC, CS } from \\"@compiled/style\\";
      <CC><CS hash=\\"31m7m\\">{[\\".cc-1iqe21w{font-size:12px}\\"]}</CS><div className={\\"cc-1iqe21w\\"}/></CC>;
      "
    `);
  });
});
