import { ClassNames } from '@compiled/react';

export default {
  title: 'ClassNames/dynamic',
};

const ClassNamesObject = ({ color }: { color: string }) => (
  <ClassNames>
    {({ css, style }) => (
      <div style={style} className={css({ fontSize: 20, color })}>
        hello world
      </div>
    )}
  </ClassNames>
);

const ClassNamesStringTemplateLiteral = (props: { size: number }) => (
  <ClassNames>
    {({ css, style }) => (
      <div
        style={style}
        className={css`
          font-size: ${props.size}px;
          color: red;
        `}>
        hello world
      </div>
    )}
  </ClassNames>
);

const ClassNamesString = (props: { decoration: string }) => (
  <ClassNames>
    {({ css, style }) => (
      <div
        style={style}
        className={css(`
          color: red;
          text-decoration-line: ${props.decoration};
        `)}>
        hello world
      </div>
    )}
  </ClassNames>
);

const ClassNamesArray = ({ weight }: { weight: number }) => (
  <ClassNames>
    {({ css, style }) => (
      <div style={style} className={css([{ fontSize: 20 }, `font-weight: ${weight}`])}>
        hello world
      </div>
    )}
  </ClassNames>
);

export const ObjectCSS = (): JSX.Element => <ClassNamesObject color="pink" />;

export const StringTemplateLiteral = (): JSX.Element => (
  <ClassNamesStringTemplateLiteral size={50} />
);

export const String = (): JSX.Element => <ClassNamesString decoration="underline" />;

export const Array = (): JSX.Element => <ClassNamesArray weight={800} />;
