import { ClassNames } from '@compiled/react';

export default {
  title: 'ClassNames | static',
};

export const ObjectCSS = () => (
  <ClassNames>
    {({ css }) => <div className={css({ fontSize: 20, color: 'blue' })}>hello world</div>}
  </ClassNames>
);

export const StringTemplateLiteral = () => (
  <ClassNames>
    {({ css }) => (
      <div
        className={css`
          font-size: 30px;
          color: red;
        `}>
        hello world
      </div>
    )}
  </ClassNames>
);

export const String = () => (
  <ClassNames>
    {({ css }) => (
      <div
        className={css(`
          font-size: 30px;
          color: purple;
        `)}>
        hello world
      </div>
    )}
  </ClassNames>
);

export const Array = () => (
  <ClassNames>
    {({ css }) => <div className={css([{ fontSize: 20 }, `color: green;`])}>hello world</div>}
  </ClassNames>
);

export const CNArgs = () => (
  <ClassNames>
    {({ css }) => (
      <div
        className={css({ fontSize: 20 }, `color: blue;`, [{ padding: 20 }], {
          backgroundColor: 'red',
        })}>
        hello world
      </div>
    )}
  </ClassNames>
);
