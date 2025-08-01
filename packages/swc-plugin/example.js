#!/usr/bin/env node

const swc = require('@swc/core');
const path = require('path');

async function runExample() {
  const pluginPath = path.resolve(__dirname, 'target/wasm32-wasip1/release/swc_plugin_compiled.wasm');
  
  console.log('SWC Plugin Example');
  console.log('==================');
  console.log();

  const testCases = [
    {
      name: 'Basic strict equality',
      code: 'if (user === "admin") { console.log("access granted"); }'
    },
    {
      name: 'Multiple comparisons',
      code: 'name === "john" && age === 25;'
    },
    {
      name: 'Mixed operators (only === should transform)',
      code: 'if (a == b && c === d && e !== f) { console.log("its all true"); }'
    },
    {
      name: 'Function call as left operand',
      code: 'const result = getValue() === expectedValue;'
    },
    {
      name: 'JSX with strict equality',
      code: 'const element = <div>{status === "active" ? "ON" : "OFF"}</div>;'
    }
  ];

  for (const testCase of testCases) {
    console.log(`${testCase.name}:`);
    console.log(`Input:  ${testCase.code}`);

    try {
      const result = await swc.transform(testCase.code, {
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

      console.log(`Output: ${result.code.trim()}`);
    } catch (error) {
      console.log(`Error:  ${error.message}`);
    }

    console.log();
  }

  console.log('Note: This is a basic example transformation.');
  console.log('Future versions will implement full Compiled CSS functionality.');
}

// Only run if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = { runExample };