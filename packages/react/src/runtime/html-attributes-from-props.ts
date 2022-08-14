import isPropValid from '@emotion/is-prop-valid';

/**
 * Looks for HTML attributes in props and filters them out
 *
 * @param props
 */
export default <T>(props: T): Partial<T> => {
  const htmlAttributes: Partial<T> = {};

  for (const key in props) {
    if (isPropValid(key)) {
      htmlAttributes[key] = props[key];
    }
  }

  return htmlAttributes;
};
