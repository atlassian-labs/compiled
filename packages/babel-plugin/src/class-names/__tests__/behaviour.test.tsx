import { transformSync } from '@babel/core';
import babelPlugin from '../../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('class names behaviour', () => {
  xit('should replace class names component style element', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/core';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (<div className={css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toInclude(
      'const ListItem = () => (<CC><CS hash="css-test">{[".css-test{font-size:20px}"]}</CS><div className={"css-test"}>hello, world!</div></CC>)'
    );
  });

  xit('should remove class names import', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/core';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
        </ClassNames>
      );
    `);

    expect(actual).not.toInclude(`import { ClassNames } from "@compiled/core";`);
  });

  xit('should add an identifier nonce to the style element', () => {
    const actual = transform(
      `
        import { ClassNames } from '@compiled/core';

        const ZoomOnHover = ({ children }) => (
          <ClassNames>
            {({ css }) =>
              children({
                className: css({
                  transition: 'transform 2000ms',
                  ':hover': {
                    transform: 'scale(2)',
                  },
                }),
              })
            }
          </ClassNames>
        );
      `
    );

    expect(actual).toInclude('<CS hash="css-test" nonce={__webpack_nonce__}>');
  });

  xit('should set children as function into a jsx expression', () => {
    const actual = transform(`
    import { ClassNames } from '@compiled/core';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) =>
          children({
            className: css({
              transition: 'transform 2000ms',
              ':hover': {
                transform: 'scale(2)',
              },
            }),
          })
        }
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`{children({
    className: "css-test",
})}`);
  });

  xit('should place self closing jsx element as a child', () => {
    const actual = transform(`
    import { ClassNames } from '@compiled/core';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`</CS><div className={\"css-test\"}/></CC>`);
  });
});
