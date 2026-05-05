import { cssMap } from '@compiled/react';

export default {
  title: 'css-map/grouping',
};

const styles = cssMap(
  {
    simpleComb: {
      'div span': {
        color: 'red',
        fontWeight: 'bold',
      },
    },
    simpleComb2: {
      'div span': {
        color: 'green',
        fontWeight: '200',
      },
    },
  },
  { group: true }
);

export const SimpleCombinatorGrouping = (): JSX.Element => {
  return (
    <div css={[styles.simpleComb2, styles.simpleComb]}>
      <div>
        <span>hello</span>
      </div>
    </div>
  );
};
