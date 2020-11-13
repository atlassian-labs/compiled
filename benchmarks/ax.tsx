export function axArr(classNames: (string | undefined | false)[]): string {
  const atomicGroups: Record<string, string> = {};
  let i = -1;

  while (++i < classNames.length) {
    if (!classNames[i]) {
      continue;
    }

    const groups = (classNames[i] as string).split(' ');
    let x = -1;

    while (++x < groups.length) {
      atomicGroups[groups[x].slice(0, groups[x].charCodeAt(0) === 95 ? 5 : undefined)] = groups[x];
    }
  }

  return Object.values(atomicGroups).join(' ');
}

export function axStatic(className: string, next: string | undefined): string {
  const atomicGroups: Record<string, string> = {};
  const groups = (className + next ? ' ' + next : '').split(' ');

  let x = -1;

  while (++x < groups.length) {
    atomicGroups[groups[x].slice(0, groups[x].charCodeAt(0) === 95 ? 5 : undefined)] = groups[x];
  }

  return Object.values(atomicGroups).join(' ');
}

export function axArgs(...classNames: (string | undefined | false)[]): string {
  const atomicGroups: Record<string, string> = {};
  let i = -1;

  while (++i < classNames.length) {
    if (!classNames[i]) {
      continue;
    }

    const groups = (classNames[i] as string).split(' ');
    let x = -1;

    while (++x < groups.length) {
      atomicGroups[groups[x].slice(0, groups[x].charCodeAt(0) === 95 ? 5 : undefined)] = groups[x];
    }
  }

  return Object.values(atomicGroups).join(' ');
}
