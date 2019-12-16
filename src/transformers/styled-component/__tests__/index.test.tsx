describe('styled component transformer', () => {
  it.todo('should replace styled component with component');

  it.todo('should add react default import if missing');

  it.todo('should add react default import if it only has named imports');

  it.todo('should do nothing if react default import is already defined');

  it.todo('should concat explicit use of class name prop on an element');

  it.todo('should concat implicit use of class name prop where props are spread into an element');

  it.todo('should concat use of inline styles when there is use of dynamic css');

  describe('using a string literal', () => {
    it.todo('should transform no template string literal');

    it.todo('should transform template string literal with string variable');

    it.todo('should transform template string literal with string import');

    it.todo('should transform template string literal with obj variable');

    it.todo('should transform template string literal with obj import');

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it.todo('should transform template string literal with function variable');

    it.todo('should transform template string literal with function import');
  });

  describe('using an object literal', () => {
    it.todo('should transform object with simple values');

    it.todo('should transform object with nested object into a selector');

    it.todo('should transform object with object selector from variable');

    it.todo('should transform object with object selector from import');

    it.todo('should transform object that has a variable reference');

    it.todo('should transform object spread from variable');

    it.todo('should transform object spread from import');

    it.todo('should transform object with string variable');

    it.todo('should transform object with string import');

    it.todo('should transform object with obj variable');

    it.todo('should transform object with obj import');

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it.todo('should transform object with function variable');

    it.todo('should transform object with function import');
  });
});
