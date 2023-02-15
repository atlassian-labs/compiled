import { ClassNameGenerator } from '../class-name-generator';

describe('ClassNameGenerator', () => {
  it('should generate class names with minimal length', () => {
    const generator = new ClassNameGenerator();
    Array.from(Array(27).keys()).forEach(() => {
      const className = generator.generateClassName('foo');
      expect(className.length).toBe(1);
    });
  });

  it('should skip reservedClassNames', () => {
    const generator = new ClassNameGenerator({ reservedClassNames: ['a', 'b', 'c'] });
    const className = generator.generateClassName('foo');
    expect(className).toBe('d');
  });

  it('should not generate class names starting with a number', () => {
    const generator = new ClassNameGenerator();
    Array.from(Array(30).keys()).forEach(() => {
      const className = generator.generateClassName('foo');
      expect(className.charAt(0)).toMatch(/[^1-9]/);
    });
  });
});
