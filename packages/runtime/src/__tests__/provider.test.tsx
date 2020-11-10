const mockFunction = jest.fn();

jest.mock('../is-node', () => ({
  isNodeEnvironment: mockFunction,
}));

const OLD_ENV = process.env;

describe('Provider index.tsx', () => {
  beforeEach(() => {
    jest.resetModules(); // most important - it clears the cache
    process.env = { ...OLD_ENV }; // make a copy
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });
  it('returns the browser provider when isNodeEnvironment returns false', () => {
    mockFunction.mockImplementation(() => false);
    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (_) {}
      return comp;
    };
    const BrowserProvider = loadComp('../provider/provider-browser');
    const Provider = loadComp('../provider');
    expect(Provider).toEqual(BrowserProvider);
  });
  it('returns the server provider when isNodeEnvironment returns true', () => {
    mockFunction.mockImplementation(() => true);
    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (_) {}
      return comp;
    };
    const ServerProvider = loadComp('../provider/provider-server');
    const Provider = loadComp('../provider');
    expect(Provider).toEqual(ServerProvider);
  });
});

describe('Server Provider', () => {
  beforeEach(() => {
    jest.resetModules(); // most important - it clears the cache
    process.env = { ...OLD_ENV }; // make a copy
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });
  it('should throw when "isNodeEnvironment" returns false', () => {
    mockFunction.mockImplementation(() => false);

    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (error) {
        expect(error).toBeDefined();
      }
      return comp;
    };

    loadComp('../provider/provider-server');
  });
  it('should not throw when "isNodeEnvironment" returns true', () => {
    mockFunction.mockImplementation(() => true);

    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (error) {
        expect(error).toBeFalsy();
      }
      return comp;
    };

    loadComp('../provider/provider-server');
  });
});

describe('Browser Provider', () => {
  beforeEach(() => {
    jest.resetModules(); // most important - it clears the cache
    process.env = { ...OLD_ENV }; // make a copy
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });
  it('should throw when "isNodeEnvironment" returns true', () => {
    mockFunction.mockImplementation(() => true);

    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (error) {
        expect(error).toBeDefined();
      }
      return comp;
    };

    loadComp('../provider/provider-browser');
  });
  it('should not throw when "isNodeEnvironment" returns false', () => {
    mockFunction.mockImplementation(() => false);

    const loadComp = (path, name = 'default') => {
      let comp = undefined;
      try {
        comp = require(path)[name];
      } catch (error) {
        expect(error).toBeFalsy();
      }
      return comp;
    };

    loadComp('../provider/provider-browser');
  });
});
