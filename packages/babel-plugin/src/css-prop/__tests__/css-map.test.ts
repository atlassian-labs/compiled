import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

describe('css map behaviour', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `
    import { css, cssMap } from '@compiled/react';

    const styles = cssMap({
      danger: {
          color: 'red',
          backgroundColor: 'red'
      },
      success: {
        color: 'green',
        backgroundColor: 'green'
      }
    });
  `;

  describe('valid syntax', () => {
    it('should evaluate css map when variant is a runtime variable', () => {
      const actual = transform(`
        ${styles}

        <div css={css(styles[variant])} />;
      `);

      expect(actual).toInclude(
        '<div className={ax([variant==="danger"&&"_syaz5scu _bfhk5scu",variant==="success"&&"_syazbf54 _bfhkbf54"])}/>'
      );
    });

    it('should evaluate css map when variant is statically defined', () => {
      const actual = transform(`
       ${styles}
        
        <div css={css(styles.success)} />;
        <div css={css(styles['danger'])} />;
      `);

      expect(actual).toInclude(
        '<div className={ax(["success"==="danger"&&"_syaz5scu _bfhk5scu","success"==="success"&&"_syazbf54 _bfhkbf54"])}/>'
      );
      expect(actual).toInclude(
        '<div className={ax([\'danger\'==="danger"&&"_syaz5scu _bfhk5scu",\'danger\'==="success"&&"_syazbf54 _bfhkbf54"])}/>'
      );
    });

    it('should combine CSS Map with other styles', () => {
      const actual = transform(
        `
        ${styles}

        <div css={css([styles[variant], { color: 'blue' }])} />;
      `
      );

      expect(actual).toInclude(
        '<div className={ax([variant==="danger"&&"_syaz5scu _bfhk5scu",variant==="success"&&"_syazbf54 _bfhkbf54","_syaz13q2"])}/>'
      );
    });
  });

  describe('invalid syntax', () => {
    it('does not support TemplateLiteral as object property', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles[\`danger\`])} />;
        `);
      }).toThrow(ErrorMessages.VARIANT_ACCESS);
    });

    it('does not support Expression as object property', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles['dang' + 'er'])} />;
        `);
      }).toThrow(ErrorMessages.VARIANT_ACCESS);
    });

    it('does not support BinaryExpression as object property', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles['dang' + 'er'])} />;
        `);
      }).toThrow(ErrorMessages.VARIANT_ACCESS);
    });

    it('does not support MemberExpression as object property', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles[props.variant])} />;
        `);
      }).toThrow(ErrorMessages.VARIANT_ACCESS);
    });

    it('does not support CallExpression as object property', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles()[variant])} />;
        `);
      }).toThrow(ErrorMessages.VARIANT_CALL_EXPRESSION);
    });

    it('does not support nesting', () => {
      expect(() => {
        transform(`
          ${styles}

          <div css={css(styles.danger.veryDanger)} />;
        `);
      }).toThrow(ErrorMessages.NESTED_VARIANT);
    });

    it('should error out if cssMap does not receive any argument', () => {
      expect(() => {
        transform(`
          import { css, cssMap } from '@compiled/react';

          const styles = cssMap();

          <div css={css(styles.danger)} />;
        `);
      }).toThrow(ErrorMessages.NUMBER_OF_ARGUMENT);
    });

    it('should error out if cssMap does not receive more than one argument', () => {
      expect(() => {
        transform(`
          import { css, cssMap } from '@compiled/react';

          const styles = cssMap({}, {});

          <div css={css(styles.danger)} />;
        `);
      }).toThrow(ErrorMessages.NUMBER_OF_ARGUMENT);
    });

    it('should error out if cssMap does not receive an object', () => {
      expect(() => {
        transform(`
          import { css, cssMap } from '@compiled/react';

          const styles = cssMap('color: red');

          <div css={css(styles.danger)} />;
        `);
      }).toThrow(ErrorMessages.ARGUMENT_TYPE);
    });

    it('should error out if spread element is used', () => {
      expect(() => {
        transform(`
          import { css, cssMap } from '@compiled/react';

          const styles = cssMap({
            ...base
          });

          <div css={css(styles.danger)} />;
        `);
      }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
    });

    it('should error out if css map object key is dynamic', () => {
      expect(() => {
        transform(`
          import { css, cssMap } from '@compiled/react';

          const styles = cssMap({
            [variantName]: { color: 'red' }
          });

          <div css={css(styles.danger)} />;
        `);
      }).toThrow(ErrorMessages.STATIC_VARIANT_KEY);
    });
  });
});
