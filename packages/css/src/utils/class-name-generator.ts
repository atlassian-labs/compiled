// CSS classes are case sensitive in non-quirk mode
// Spec: https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors
// CSS classes can contain only the characters [a-zA-Z0-9] and ISO 10646 characters U+00A0 and higher, plus the hyphen (-) and the underscore (_); they cannot start with a digit, two hyphens, or a hyphen followed by a digit.
// Spec: https://www.w3.org/TR/CSS21/syndata.html#characters
const acceptPrefixBase = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const acceptPrefix = acceptPrefixBase.split('');
const acceptChars = `${acceptPrefixBase}-0123456789`.split('');

export class ClassNameGenerator {
  newClassSize: number;
  reservedClassNames: string[];
  prefix?: string;
  constructor(opts: { reservedClassNames?: string[]; prefix?: string } = {}) {
    this.newClassSize = 0;
    this.reservedClassNames = opts.reservedClassNames || [];
    this.prefix = opts.prefix;

    if (this.prefix && !acceptPrefix.includes(this.prefix)) {
      throw new Error(`'${this.prefix}' is an invalid prefix. The allowed prefix is [a-zA-Z_]`);
    }
  }
  generateClassName(): string {
    const chars = [];
    let rest = this.prefix
      ? this.newClassSize + 1
      : (this.newClassSize - (this.newClassSize % acceptPrefix.length)) / acceptPrefix.length;
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
    const newClassName = `${
      this.prefix ? this.prefix : acceptPrefix[this.newClassSize % acceptPrefix.length]
    }${chars.join('')}`;

    if (this.reservedClassNames && this.reservedClassNames.includes(newClassName)) {
      this.newClassSize++;
      return this.generateClassName();
    }

    // Avoid any class name which includes the word 'ad' to prevent adblocker from blocking the HTML element
    if (newClassName.toLowerCase().includes('ad')) {
      this.newClassSize++;
      return this.generateClassName();
    }

    this.newClassSize++;
    return newClassName;
  }
}
