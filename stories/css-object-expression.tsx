import { css } from '@compiled/react';

import { primaryCallExpression, primaryTaggedTemplateExpression } from './mixins';

export default {
  title: 'css/object expression',
};

export const Static = (): JSX.Element => {
  const styles = css({
    display: 'flex',
    fontSize: '30px',
    color: 'purple',
  });

  return <div css={styles}>purple text</div>;
};

export const Inline = (): JSX.Element => (
  <div
    css={css({
      display: 'flex',
      fontSize: '30px',
      color: 'purple',
    })}>
    purple text
  </div>
);

export const LocalVariable = (): JSX.Element => {
  const variableColor = 'orange';
  const styles = css({
    display: 'flex',
    fontSize: '30px',
    color: variableColor,
  });

  return <div css={styles}>orange text</div>;
};

export const ImportedVariable = (): JSX.Element => (
  <div css={primaryCallExpression}>bold, underlined primary text</div>
);

export const SpreadImportedVariable = (): JSX.Element => {
  const styles = css({
    ...primaryCallExpression,
    backgroundColor: 'yellow',
  });

  return <div css={styles}>bold, underlined primary text with yellow background</div>;
};

export const SpreadImportedTaggedTemplatedExpression = (): JSX.Element => {
  const styles = css({
    ...primaryTaggedTemplateExpression,
    backgroundColor: 'yellow',
  });

  return <div css={styles}>bold, underlined primary text with yellow background</div>;
};
