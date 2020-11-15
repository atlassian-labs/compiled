export function newAx(classNames: (string | undefined | false)[]): string {
  const atomicGroups: Record<string, string> = {};

  for (let i = 0; i < classNames.length; i++) {
    const val = classNames[i];
    if (!val) {
      continue;
    }

    const groups = val.split(' ');

    for (let x = 0; x < groups.length; x++) {
      const val = groups[x];
      atomicGroups[val.slice(0, val.charCodeAt(0) === 95 ? 5 : undefined)] = val;
    }
  }

  let str = '';

  for (const key in atomicGroups) {
    const value = atomicGroups[key];
    str += value;
  }

  return str;
}
