declare var layers: {
  modal: () => number,
};

declare type Tokens = typeof tokens;
declare type CSSTokenMap = {
  'elevation.surface': 'var(--ds-surface)',
};
declare var tokens: {
  +'elevation.surface': '--ds-surface',
};
declare type CSSToken = $ElementType<CSSTokenMap, $Keys<CSSTokenMap>>;
declare function token<T: $Keys<Tokens>>(path: T, fallback?: string): $ElementType<CSSTokenMap, T>;
