import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('css prop behaviour', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `{
      color: 'green',
      backgroundColor: 'green'
  }`;

  const styles2 = `{
      marginTop: '10px',
  }`;

  it('should transform xcss prop', () => {
    const actual = transform(
      `
      import { xcss } from '@compiled/react';

      const styles = xcss(${styles});

      const Component = () => <div xcss={styles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._bfhkbf54{background-color:green}";
      const _ = "._syazbf54{color:green}";
      const styles = "_syazbf54 _bfhkbf54";
      const Component = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div xcss={styles} />}
        </CC>
      );
      "
    `);
  });

  it('should handle array', () => {
    const actual = transform(`
      import { xcss } from '@compiled/react';

      const styles = xcss(${styles});
      const styles2 = xcss(${styles2});

      const Component = () => <div xcss={[styles, styles2]} />;
    `);

    expect(actual).toIncludeMultiple(['<CS>{[_,_2,_3]}</CS>', '<div xcss={[styles,styles2]}/>']);
  });

  it('should handle complex logic', () => {
    const actual = transform(`
      import { xcss } from '@compiled/react';

      const styles = xcss(${styles});

      const Component = () => <div xcss={foo.bar() && baz[qux] && styles } />;
    `);

    expect(actual).toIncludeMultiple([
      '<CS>{[_,_2]}</CS>',
      '<div xcss={foo.bar()&&baz[qux]&&styles}/>',
    ]);
  });
});
