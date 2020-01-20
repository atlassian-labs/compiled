export const createSetupError = () => {
  return `
@compiled/css-in-js

You need to apply the compiled css in js Typescript transformer to use this!
Unsure what a Typescript transformer is? Read the handbook!
https://github.com/madou/typescript-transformer-handbook

Quick setup:

1. Install ttypescript:

  <code>npm i ttypescript</code>

2. Add the transformer to your tsconfig.json:

  <code>
    {
      "compilerOptions": {
        "plugins": [{ "transform": "@compiled/css-in-js/dist/ts-transformer" }]
      }
    }
  </code>

3. Build your code with ttypescript:

  - Using tsc CLI? Run ttsc instead of tsc
  - Using Webpack? Update ts-loader options to point to ttypescript:
    <code>
      options: {
        compiler: 'ttypescript',
      }
    </code>
  - Using Parcel? Just install the plugin <code>npm i parcel-plugin-ttypescript</code>
`;
};
