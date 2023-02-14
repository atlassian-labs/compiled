const acceptPrefix = 'abcdefghijklmnopqrstuvwxyz_'.split('');
const acceptChars = 'abcdefghijklmnopqrstuvwxyz_-0123456789'.split('');

export class ClassNameGenerator {
  newClassSize: number;
  reservedClassNames: string[];
  constructor(opts: { reservedClassNames?: string[] } = {}) {
    this.newClassSize = 0;
    this.reservedClassNames = opts.reservedClassNames || [];
  }
  generateClassName(original: string): string {
    const chars = [];
    let rest =
      (this.newClassSize - (this.newClassSize % acceptPrefix.length)) / acceptPrefix.length;
    if (rest > 0) {
      while (true) {
        rest -= 1;
        const m = rest % acceptChars.length;
        const c = acceptChars[m];
        chars.push(c);
        rest -= m;
        if (rest === 0) {
          break;
        }
        rest /= acceptChars.length;
      }
    }
    const prefixIndex = this.newClassSize % acceptPrefix.length;
    const newClassName = `${acceptPrefix[prefixIndex]}${chars.join('')}`;

    if (this.reservedClassNames && this.reservedClassNames.includes(newClassName)) {
      this.newClassSize++;
      return this.generateClassName(original);
    }

    this.newClassSize++;
    return newClassName;
  }
}
