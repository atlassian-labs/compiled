jest.mock('../is-node', () => ({
  isNodeEnvironment: () => false,
}));

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  jest.resetModules();
});

describe('style-cache', () => {
  it('should collect all SSR style tags and move them to the head', () => {
    document.body.innerHTML = '<style data-cmpld="s">.a { display: block; }</style>';

    require('../style-cache');

    expect(document.body.innerHTML).toBe('');
    expect(document.head.innerHTML).toInclude(
      '<style data-cmpld="s">.a { display: block; }</style>'
    );
  });

  it('should consolidate all style tags in head', () => {
    jest.useFakeTimers();

    const styles = [
      '<style data-cmpld="s">.a { display: block; }</style>',
      '<style data-cmpld="s">.b { color: red; }</style>',
      '<style data-cmpld="s">.c { width: 100%; }</style>',
    ].join('');

    document.body.innerHTML = styles;

    require('../style-cache');

    expect(document.body.innerHTML).toBe('');
    // all style tags should have been moved to head
    expect(document.head.innerHTML).toInclude(styles);

    jest.runAllTimers();

    // all style tags should now be consolidated
    expect(document.head.innerHTML).toInclude(
      '<style data-cmpld="h">.a { display: block; }.b { color: red; }.c { width: 100%; }</style>'
    );
  });

  it('should create client cache from SSR cache', () => {
    document.body.innerHTML = '<script data-cmpld="c">{".b { display: block; }": true}</script>';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useCache } = require('../style-cache');

    expect(useCache()).toEqual({ ['.b { display: block; }']: true });
  });
});
