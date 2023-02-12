import { parse } from 'postcss-values-parser';

import { isColor, isWidth } from '../utils';

describe('expand utils', () => {
  it('should return true for valid width units', () => {
    [
      'px',
      'rem',
      'em',
      '%',
      'pt',
      'cm',
      'mm',
      'Q',
      'in',
      'pc',
      'ex',
      'ch',
      'lh',
      'vw',
      'vh',
      'vmin',
      'vmax',
      'fr',
    ].forEach((unit) => {
      const value = parse(`1${unit}`);

      const actual = isWidth(value.nodes[0]);

      expect(actual).toBe(true);
    });
  });

  it('should return false for invalid width unit', () => {
    const value = parse(`1fake`);

    const actual = isWidth(value.nodes[0]);

    expect(actual).toBe(false);
  });

  it('should return false for invalid width no unit', () => {
    const value = parse(`1`);

    const actual = isWidth(value.nodes[0]);

    expect(actual).toBe(false);
  });

  it('should return true for fit-content', () => {
    const value = parse(`fit-content`);

    const actual = isWidth(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for fit-content(5em)', () => {
    const value = parse(`fit-content(5em)`);

    const actual = isWidth(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color word', () => {
    const value = parse('red');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color hex', () => {
    const value = parse('#fff');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color rgb', () => {
    const value = parse('rgb(255, 255, 255)');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color rgba', () => {
    const value = parse('rgba(255, 255, 255, 0.5)');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color hsl', () => {
    const value = parse('hsl(188, 97%, 28%)');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color hsla', () => {
    const value = parse('hsla(188, 97%, 28%, .3)');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for a valid color hsla', () => {
    const value = parse('hsla(188, 97%, 28%, .3)');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });

  it('should return true for special color words', () => {
    const value = parse('transparent');

    const actual = isColor(value.nodes[0]);

    expect(actual).toBe(true);
  });
});
