import { transform } from '../../test-utils';

describe('Keyframes', () => {
  it('places classes in given order when static styles precede keyframes expression', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';

      const animation = keyframes\`
        from { top: 0; }
        to { top: 100px; }
      \`;

      const ListItem = styled.div\`
        font-size: 20px;
        border-radius: 3px;
        animation: \${animation};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._1wybgktf{font-size:20px}',
      '._2rko1l7b{border-radius:3px}',
      '._y44v1bcx{animation:kfwl3rt}',
      '{ax(["_2rko1l7b _y44v1bcx _1wybgktf", __cmplp.className])}',
    ]);
  });

  it('places classes in given order when keyframes expression precedes static styles', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';

      const animation = keyframes({
        from: { top: 0 },
        to: { top: '100px' },
      });

      const ListItem = styled.div\`
        animation: \${animation};
        font-size: 20px;
        border-radius: 3px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._y44v178k{animation:kvif0b9}',
      '._1wybgktf{font-size:20px}',
      '._2rko1l7b{border-radius:3px}',
      '{ax(["_y44v178k _2rko1l7b _1wybgktf", __cmplp.className])}',
    ]);
  });

  it('evaluates any expressions that precede a keyframes expression', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';

      const color = 'red';

      const animation = keyframes\`
        from { top: 0; }
        to { top: 100px; }
      \`;

      const ListItem = styled.div\`
        color: \${color};
        animation: \${animation};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._syaz5scu{color:red}',
      '._y44v1bcx{animation:kfwl3rt}',
      '{ax(["_y44v1bcx _syaz5scu", __cmplp.className])}',
    ]);
  });

  it('evaluates keyframes expression when it precedes another expression', () => {
    const actual = transform(`
      import { styled, keyframes } from '@compiled/react';

      const color = 'red';

      const animation = keyframes\`
        from { top: 0; }
        to { top: 100px; }
      \`;

      const ListItem = styled.div\`
        animation: \${animation};
        color: \${color};
      \`;
    `);

    expect(actual).toIncludeMultiple([
      '._y44v1bcx{animation:kfwl3rt}',
      '._syaz5scu{color:red}',
      '{ax(["_y44v1bcx _syaz5scu", __cmplp.className])}',
    ]);
  });
});
