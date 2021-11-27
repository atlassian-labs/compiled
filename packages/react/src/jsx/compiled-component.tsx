import React from 'react';

import { CC, CS, ax } from '../runtime';

interface CompiledComponentProps {
  children: any;
  css: [string, string[]][];
  className?: string;
  type: any;
}

const merge = (arr1: string[], arr2: string[]) => {
  if (!arr2) {
    return;
  }

  for (let i = 0; i < arr2.length; i++) {
    arr1.push(arr2[i]);
  }
};

function CompiledComponent({
  children,
  css,
  type: Type,
  className,
  ...props
}: CompiledComponentProps): JSX.Element {
  const classNames: string[] = [];
  const sheets: string[] = [];

  for (let i = 0; i < css.length; i++) {
    const sheet = css[i];

    classNames.push(sheet[0]);
    merge(sheets, sheet[1]);
  }

  return (
    <CC>
      <CS>{sheets}</CS>
      <Type className={ax(classNames)} {...props}>
        {children}
      </Type>
    </CC>
  );
}

export default CompiledComponent;
