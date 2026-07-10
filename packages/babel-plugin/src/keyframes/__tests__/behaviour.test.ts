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
      '._4ya3eESPN1{font-size:20px}',
      '._0bjKvD4Y4b{border-radius:3px}',
      '._2fBhteNtNN{animation:kfwl3rt}',
      '{ax(["_0bjKvD4Y4b _2fBhteNtNN _4ya3eESPN1", __cmplp.className])}',
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
      '._2fBhteVXta{animation:kvif0b9}',
      '._4ya3eESPN1{font-size:20px}',
      '._0bjKvD4Y4b{border-radius:3px}',
      '{ax(["_2fBhteVXta _0bjKvD4Y4b _4ya3eESPN1", __cmplp.className])}',
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
      '._1UtDYzGowl{color:red}',
      '._2fBhteNtNN{animation:kfwl3rt}',
      '{ax(["_2fBhteNtNN _1UtDYzGowl", __cmplp.className])}',
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
      '._2fBhteNtNN{animation:kfwl3rt}',
      '._1UtDYzGowl{color:red}',
      '{ax(["_2fBhteNtNN _1UtDYzGowl", __cmplp.className])}',
    ]);
  });
});
