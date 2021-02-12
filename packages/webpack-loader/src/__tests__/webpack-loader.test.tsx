import loader from '../index';
import { transform } from '@compiled/babel-plugin';

jest.mock('@compiled/babel-plugin');

const getLoader = (opts: { addDependency: jest.Mock; callback: jest.Mock }) =>
  loader.bind({
    async: () => opts.callback,
    resourcePath: '/projects/index.js',
    addDependency: opts.addDependency,
  });

describe('webpack loader', () => {
  it('should bail out early if the file has no compiled in it', () => {
    const loader = getLoader({ addDependency: jest.fn(), callback: jest.fn() });

    loader('console.log(undefined);');

    expect(transform).not.toHaveBeenCalled();
  });

  it('should transform code if compiled has been found', () => {
    const loader = getLoader({ addDependency: jest.fn(), callback: jest.fn() });
    const code = `import '@compiled/react';`;

    loader(code);

    expect(transform).toHaveBeenCalledWith(code, {
      // Filename needed for module traversal
      filename: '/projects/index.js',
      // Cache module traversal calls
      opts: { cache: true },
    });
  });

  it('should callback with transformed code', async () => {
    const callback = jest.fn();
    (transform as jest.Mock).mockReturnValue(
      Promise.resolve({ code: 'transformed-code', includedFiles: [] })
    );
    const loader = getLoader({ addDependency: jest.fn(), callback });

    await loader(`import '@compiled/react';`);

    expect(callback).toHaveBeenCalledWith(null, 'transformed-code');
  });

  it('should add dependencies for included files', async () => {
    const addDependency = jest.fn();
    (transform as jest.Mock).mockReturnValue(
      Promise.resolve({ code: 'transformed-code', includedFiles: ['one', 'two'] })
    );
    const loader = getLoader({ callback: jest.fn(), addDependency });

    await loader(`import '@compiled/react';`);

    expect(addDependency).toHaveBeenCalledWith('one');
    expect(addDependency).toHaveBeenCalledWith('two');
    expect(addDependency).toHaveBeenCalledTimes(2);
  });

  it('should callback on error', async () => {
    const callback = jest.fn();
    (transform as jest.Mock).mockReturnValue(Promise.reject('error occurred'));
    const loader = getLoader({ addDependency: jest.fn(), callback });

    await loader(`import '@compiled/react';`);

    expect(callback).toHaveBeenCalledWith('error occurred');
  });
});
