import path from 'path';

export default function compiledLoader(this: any, content: string): string {
  console.log('BUNDLING', content);

  this.addDependency(
    path.normalize('/Users/mdougall/projects/compiled/examples/packages/webpack/src/app.js')
  );

  return content;
}
