import { css } from '@compiled/react';

export default {
  title: 'css/combinators',
};

export const AdjacentSiblingCombinator = (): JSX.Element => {
  const styles = css`
    border: 1px solid red;

    & + & {
      margin-top: 10px;
      color: green;
    }
  `;

  return (
    <div>
      <div css={styles}>Row 1</div>
      <div css={styles}>Row 2</div>
      <div css={styles}>Row 3</div>
      <div css={styles}>Row 4</div>
    </div>
  );
};

export const GeneralSiblingCombinator = (): JSX.Element => {
  const styles = css`
    & ~ & {
      color: red;
    }
  `;

  return (
    <div>
      <div>div</div>
      <div css={styles}>Black text</div>
      <div>div</div>
      <div css={styles}>Red text</div>
      <div css={styles}>Red text</div>
    </div>
  );
};

export const ChildCombinator = (): JSX.Element => {
  const styles = css`
    & > & {
      color: red;
    }
  `;

  return (
    <div css={styles}>
      Box
      <div css={styles}>
        Box in Box
        <div css={styles}>
          Box in Box in Box
          <div>div in Box in Box in Box</div>
        </div>
      </div>
    </div>
  );
};
