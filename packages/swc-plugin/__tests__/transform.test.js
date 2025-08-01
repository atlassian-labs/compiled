const swc = require('@swc/core');
const path = require('path');

describe('@compiled/swc-plugin', () => {
  const pluginPath = path.resolve(__dirname, '../target/wasm32-wasip1/release/swc_plugin_compiled.wasm');

  const transformCode = async (code) => {
    return await swc.transform(code, {
      jsc: {
        parser: {
          syntax: 'ecmascript',
          jsx: true,
        },
        experimental: {
          plugins: [[pluginPath, {}]],
        },
      },
    });
  };

  it('should transform left side of strict equality operator to "kdy1"', async () => {
    const input = 'if (user === "admin") { console.log("access granted"); }';
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === "admin"');
    expect(result.code).not.toContain('user === "admin"');
  });

  it('should handle multiple strict equality comparisons', async () => {
    const input = `
      if (name === "john") {
        return value === 42;
      }
    `;
    const result = await transformCode(input);
    
    // Both left sides should be replaced with "kdy1"
    expect(result.code).toContain('kdy1 === "john"');
    expect(result.code).toContain('kdy1 === 42');
    expect(result.code).not.toContain('name === "john"');
    expect(result.code).not.toContain('value === 42');
  });

  it('should only transform strict equality (===) and not loose equality (==)', async () => {
    const input = `
      if (a == b) {
        return c === d;
      }
    `;
    const result = await transformCode(input);
    
    // Only strict equality should be transformed
    expect(result.code).toContain('a == b'); // unchanged
    expect(result.code).toContain('kdy1 === d'); // transformed
    expect(result.code).not.toContain('c === d');
  });

  it('should handle complex expressions with strict equality', async () => {
    const input = 'return obj.property === "value" && array[0] === 123;';
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === "value"');
    expect(result.code).toContain('kdy1 === 123');
    expect(result.code).not.toContain('obj.property === "value"');
    expect(result.code).not.toContain('array[0] === 123');
  });

  it('should handle function calls as left operand', async () => {
    const input = 'if (getValue() === expected) { return true; }';
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === expected');
    expect(result.code).not.toContain('getValue() === expected');
  });

  it('should not transform other comparison operators', async () => {
    const input = `
      if (a !== b) return false;
      if (x > y) return true;
      if (p <= q) return maybe;
    `;
    const result = await transformCode(input);
    
    // These should remain unchanged
    expect(result.code).toContain('a !== b');
    expect(result.code).toContain('x > y');
    expect(result.code).toContain('p <= q');
  });

  it('should handle JSX with strict equality', async () => {
    const input = 'const element = <div>{status === "active" ? "ON" : "OFF"}</div>;';
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === "active"');
    expect(result.code).not.toContain('status === "active"');
  });

  it('should preserve right operand of strict equality', async () => {
    const input = 'const isEqual = leftValue === rightValue;';
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === rightValue');
    expect(result.code).not.toContain('leftValue === rightValue');
  });

  it('should handle nested strict equality comparisons', async () => {
    const input = `
      function test() {
        if ((a === b) && (c === d)) {
          return e === f;
        }
      }
    `;
    const result = await transformCode(input);
    
    expect(result.code).toContain('kdy1 === b');
    expect(result.code).toContain('kdy1 === d');
    expect(result.code).toContain('kdy1 === f');
    expect(result.code).not.toContain('a === b');
    expect(result.code).not.toContain('c === d');
    expect(result.code).not.toContain('e === f');
  });

  it('should handle empty input', async () => {
    const input = '';
    const result = await transformCode(input);
    
    expect(result.code).toBe('');
  });

  it('should handle code without strict equality operators', async () => {
    const input = `
      function greet(name) {
        console.log("Hello " + name);
        return name.length > 0;
      }
    `;
    const result = await transformCode(input);
    
    // Should remain unchanged since no === operators
    expect(result.code).toContain('console.log("Hello " + name)');
    expect(result.code).toContain('name.length > 0');
    expect(result.code).not.toContain('kdy1');
  });
});