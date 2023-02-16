import { ClassNameGenerator } from '../class-name-generator';

describe('ClassNameGenerator', () => {
  it('should generate class names with minimal length', () => {
    const generator = new ClassNameGenerator();
    Array.from(Array(27).keys()).forEach(() => {
      const className = generator.generateClassName();
      expect(className.length).toBe(1);
    });
  });

  it('should skip reservedClassNames', () => {
    const generator = new ClassNameGenerator({ reservedClassNames: ['a', 'b', 'c'] });
    const className = generator.generateClassName();
    expect(className).toBe('d');
  });

  it('should not generate class names starting with a number if prefix is not given', () => {
    const generator = new ClassNameGenerator();
    Array.from(Array(30).keys()).forEach(() => {
      const className = generator.generateClassName();
      expect(className.charAt(0)).toMatch(/[^1-9]/);
    });
  });

  it('should prefix class names', () => {
    const prefix = '_';
    const generator = new ClassNameGenerator({ prefix });
    expect(generator.generateClassName().startsWith(prefix)).toBeTrue();
  });

  it('should throw an error if invalid prefix is given', () => {
    expect(() => {
      new ClassNameGenerator({ prefix: '-' });
    }).toThrowErrorMatchingInlineSnapshot(
      `"'-' is an invalid prefix. The allowed prefix is [a-zA-Z_]"`
    );
  });

  it('should not generate class name which includes the word "ad"', () => {
    const generator = new ClassNameGenerator({ prefix: 'a' });
    Array.from(Array(10).keys()).forEach(() => {
      const className = generator.generateClassName();
      expect(className.toLocaleLowerCase().includes('ad')).toBeFalse();
    });
  });
});
