export type UseCacheHook = () => Record<string, true>;

export type ProviderComponent = (props: {
  children: JSX.Element[] | JSX.Element;
}) => JSX.Element[] | JSX.Element;
