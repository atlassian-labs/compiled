import { cstyle } from '@compiled/dom__experimental';

export default {
  title: 'dom__experimental',
};

const styles = cstyle.create({
  red: {
    color: 'red',
  },
  blue: {
    color: 'blue',
  },
  interactive: {
    display: 'inline-block',
    userSelect: 'none',
    fontWeight: 600,
    borderRadius: '3px',
    padding: '5px',
    ':focus': {
      outline: '2px solid blue',
    },
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    ':active': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
  },
});

export const Styles = (): JSX.Element => (
  <>
    <div className={cstyle([styles.blue, styles.red])}>Red text</div>
    <div className={cstyle([styles.red, styles.blue])}>Blue text</div>
    <div className={cstyle([false && styles.blue])}>Black text</div>
    <div tabIndex={-1} className={styles.interactive}>
      I am interactive!
    </div>
  </>
);
