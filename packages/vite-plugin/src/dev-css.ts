import type { IncomingMessage, ServerResponse } from 'http';

const COMPILED_CSS_REQUEST = /\.compiled\.css(?:$|\?)/;
const COMPILED_CSS_IMPORT = /\.compiled\.css$/;
const STYLE_IMPORTER = /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|[?&])/;
const HTML_IMPORTER = /\.html(?:$|\?)/;

const COMPILED_DEV_STYLE_ID = '@compiled/vite-plugin:compiled.css';
const COMPILED_DEV_SORT_PATH = '@compiled/vite-plugin/sort-css';
const COMPILED_DEV_PROXY_PREFIX = 'virtual:@compiled/vite-plugin/css-proxy:';
const RESOLVED_COMPILED_DEV_PROXY_PREFIX = `\0${COMPILED_DEV_PROXY_PREFIX}`;
const COMPILED_DEV_LOCAL_CSS_PREFIX = 'virtual:@compiled/vite-plugin/local-css:';
const RESOLVED_COMPILED_DEV_LOCAL_CSS_PREFIX = `\0${COMPILED_DEV_LOCAL_CSS_PREFIX}`;
const COMPILED_DEV_INLINE_PREFIX = 'virtual:@compiled/vite-plugin/css-inline:';
const COMPILED_DEV_RUNTIME_ID = 'virtual:@compiled/vite-plugin/css-runtime';
const RESOLVED_COMPILED_DEV_RUNTIME_ID = `\0${COMPILED_DEV_RUNTIME_ID}`;
const MAX_CSS_PAYLOAD_SIZE = 50_000_000;

type ResolveOptions = {
  scan?: boolean;
  ssr?: boolean;
  [key: string]: unknown;
};

type DevCssPluginContext = {
  resolve(
    source: string,
    importer: string | undefined,
    options: ResolveOptions & { skipSelf: boolean }
  ): Promise<{
    external?: boolean | 'absolute' | 'relative';
    id: string;
  } | null>;
};

type DevCssServer = {
  middlewares: {
    use(
      handler: (
        request: IncomingMessage,
        response: ServerResponse,
        next: () => void
      ) => void | Promise<void>
    ): void;
  };
};

type DevCssHooks = {
  configResolved(config: { base: string; command: string }): void;
  configureServer(server: DevCssServer): void;
  load(id: string, options?: { ssr?: boolean }): string | null;
  resolveId(
    this: DevCssPluginContext,
    source: string,
    importer: string | undefined,
    options: ResolveOptions
  ): Promise<string | null>;
};

export const isCompiledCssRequest = (id: string): boolean => COMPILED_CSS_REQUEST.test(id);

const encodeModuleId = (id: string): string => encodeURIComponent(id);
const decodeModuleId = (id: string): string | undefined => {
  try {
    return decodeURIComponent(id);
  } catch {
    return undefined;
  }
};

const toInlineRequest = (id: string): string => `${id}${id.includes('?') ? '&' : '?'}inline`;

const isScriptImport = (importer: string | undefined): importer is string =>
  Boolean(importer && !STYLE_IMPORTER.test(importer) && !HTML_IMPORTER.test(importer));

const getRequestPath = (url: string): string => new URL(url, 'http://vite.local').pathname;

/**
 * Vite normally injects each CSS import into a separate style element in
 * development. These hooks replace script imports of `.compiled.css` with
 * JavaScript proxies. Each proxy imports Vite's fully processed CSS through
 * the public `?inline` API and registers it in one browser-side stylesheet,
 * allowing the complete active stylesheet to be sorted across module files.
 */
export const createDevCssHooks = (
  sortCss: (css: string) => string,
  getLocalCss: (id: string) => string | undefined
): DevCssHooks => {
  let isDevServer = false;
  let sortEndpoint = `/${COMPILED_DEV_SORT_PATH}`;
  let sortEndpointPath = sortEndpoint;

  return {
    configResolved(config) {
      isDevServer = config.command === 'serve';
      sortEndpoint = `${config.base}${COMPILED_DEV_SORT_PATH}`;
      sortEndpointPath = getRequestPath(sortEndpoint);
    },

    async resolveId(source, importer, options) {
      if (!isDevServer || options.ssr) {
        return null;
      }

      if (source === COMPILED_DEV_RUNTIME_ID) {
        return RESOLVED_COMPILED_DEV_RUNTIME_ID;
      }

      if (source.startsWith(COMPILED_DEV_INLINE_PREFIX)) {
        const cssId = decodeModuleId(source.slice(COMPILED_DEV_INLINE_PREFIX.length));
        return cssId ? toInlineRequest(cssId) : null;
      }

      if (source.startsWith(COMPILED_DEV_LOCAL_CSS_PREFIX)) {
        return `${RESOLVED_COMPILED_DEV_LOCAL_CSS_PREFIX}${source.slice(
          COMPILED_DEV_LOCAL_CSS_PREFIX.length
        )}.js`;
      }

      if (options.scan || !isScriptImport(importer) || !COMPILED_CSS_IMPORT.test(source)) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (!resolved || resolved.external || !isCompiledCssRequest(resolved.id)) {
        return null;
      }

      return `${RESOLVED_COMPILED_DEV_PROXY_PREFIX}${encodeModuleId(resolved.id)}.js`;
    },

    load(id, options) {
      if (!isDevServer || options?.ssr) {
        return null;
      }

      if (id === RESOLVED_COMPILED_DEV_RUNTIME_ID) {
        return `
          const styleId = ${JSON.stringify(COMPILED_DEV_STYLE_ID)}
          const endpoint = ${JSON.stringify(sortEndpoint)}
          const modules = new Map()
          let requestVersion = 0
          let scheduled = false

          const getStyle = () => {
            if (!('document' in globalThis)) return undefined

            let style = document.querySelector(
              \`style[data-compiled-vite-dev-id="\${styleId}"]\`
            )
            if (!style) {
              style = document.createElement('style')
              style.setAttribute('type', 'text/css')
              style.setAttribute('data-compiled-vite-dev-id', styleId)

              const nonceMeta = document.querySelector('meta[property="csp-nonce"]')
              const nonce = nonceMeta?.nonce || nonceMeta?.getAttribute('nonce')
              if (nonce) style.setAttribute('nonce', nonce)

              document.head.appendChild(style)
            }
            return style
          }

          const updateStyle = (css) => {
            const style = getStyle()
            if (style) style.textContent = css
          }

          const removeStyle = () => {
            if (!('document' in globalThis)) return
            document
              .querySelector(\`style[data-compiled-vite-dev-id="\${styleId}"]\`)
              ?.remove()
          }

          const scheduleUpdate = () => {
            requestVersion += 1
            if (scheduled) return
            scheduled = true

            Promise.resolve().then(async () => {
              scheduled = false
              const request = requestVersion
              const styles = [...modules.values()]

              if (styles.length === 0) {
                removeStyle()
                return
              }

              try {
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    Accept: 'text/css',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(styles),
                })
                if (!response.ok) throw new Error(await response.text())

                const css = await response.text()
                if (request === requestVersion) updateStyle(css)
              } catch (error) {
                if (request !== requestVersion) return
                updateStyle(styles.join('\\n'))
                console.warn(
                  '[@compiled/vite-plugin] Failed to sort development CSS',
                  error
                )
              }
            })
          }

          export const registerCompiledCss = (id, css) => {
            if (modules.get(id) === css) return
            if (modules.size === 0) getStyle()
            modules.set(id, css)
            scheduleUpdate()
          }

          export const unregisterCompiledCss = (id) => {
            if (!modules.delete(id)) return
            scheduleUpdate()
          }
        `;
      }

      if (!id.startsWith(RESOLVED_COMPILED_DEV_PROXY_PREFIX) || !id.endsWith('.js')) {
        if (!id.startsWith(RESOLVED_COMPILED_DEV_LOCAL_CSS_PREFIX) || !id.endsWith('.js')) {
          return null;
        }

        const cssId = decodeModuleId(
          id.slice(RESOLVED_COMPILED_DEV_LOCAL_CSS_PREFIX.length, -'.js'.length)
        );
        const css = cssId && getLocalCss(cssId);
        if (!cssId || !css) {
          return null;
        }

        return `
          import {
            registerCompiledCss,
            unregisterCompiledCss,
          } from ${JSON.stringify(COMPILED_DEV_RUNTIME_ID)}

          const id = ${JSON.stringify(`local:${cssId}`)}
          registerCompiledCss(id, ${JSON.stringify(css)})

          if (import.meta.hot) {
            import.meta.hot.accept()
            import.meta.hot.prune(() => unregisterCompiledCss(id))
          }
        `;
      }

      const cssId = decodeModuleId(
        id.slice(RESOLVED_COMPILED_DEV_PROXY_PREFIX.length, -'.js'.length)
      );
      if (!cssId) {
        return null;
      }
      const inlineModuleId = `${COMPILED_DEV_INLINE_PREFIX}${encodeModuleId(cssId)}`;

      return `
        import css from ${JSON.stringify(inlineModuleId)}
        import {
          registerCompiledCss,
          unregisterCompiledCss,
        } from ${JSON.stringify(COMPILED_DEV_RUNTIME_ID)}

        const id = ${JSON.stringify(cssId)}
        registerCompiledCss(id, css)

        if (import.meta.hot) {
          import.meta.hot.accept()
          import.meta.hot.prune(() => unregisterCompiledCss(id))
        }

        export default css
      `;
    },

    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (
          request.method !== 'POST' ||
          !request.url ||
          getRequestPath(request.url) !== sortEndpointPath
        ) {
          next();
          return;
        }

        try {
          let body = '';
          for await (const chunk of request) {
            body += chunk;
            if (body.length > MAX_CSS_PAYLOAD_SIZE) {
              throw new Error('CSS payload exceeds 50 MB');
            }
          }

          const styles = JSON.parse(body);
          if (!Array.isArray(styles) || styles.some((style) => typeof style !== 'string')) {
            throw new Error('Expected an array of CSS strings');
          }

          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/css');
          response.end(sortCss(styles.join('\n')));
        } catch (error) {
          const err = error as Error;
          response.statusCode = 400;
          response.end(`[@compiled/vite-plugin] Failed to sort development CSS: ${err.message}`);
        }
      });
    },
  };
};
