const mockNodeEnvFunction = jest.fn();

jest.mock('../is-node', () => ({
  isNodeEnvironment: mockNodeEnvFunction,
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
    mockNodeEnvFunction.mockImplementation(() => false);

    const BrowserProvider = require('../provider/provider-browser').default;
    const Provider = require('../provider').default;

    expect(Provider).toEqual(BrowserProvider);
  });

  it('returns the server provider when isNodeEnvironment returns true', () => {
    mockNodeEnvFunction.mockImplementation(() => true);

    const ServerProvider = require('../provider/provider-server').default;
    const Provider = require('../provider').default;

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
    mockNodeEnvFunction.mockImplementation(() => false);

    expect(() => require('../provider/provider-server')).toThrowErrorMatchingSnapshot();
  });

  it('should not throw when "isNodeEnvironment" returns true', () => {
    mockNodeEnvFunction.mockImplementation(() => true);

    expect(() => require('../provider/provider-server')).not.toThrowError();
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
    mockNodeEnvFunction.mockImplementation(() => true);

    expect(() => require('../provider/provider-browser')).toThrowErrorMatchingSnapshot();
  });

  it('should not throw when "isNodeEnvironment" returns false', () => {
    mockNodeEnvFunction.mockImplementation(() => false);

    expect(() => require('../provider/provider-browser')).not.toThrowError();
  });
});
