export const colors = {
  primary: 'purple',
  danger: 'orange',
};

const fontSize = (() => 12)();

export const objectStyles = {
  fontSize,
  color: colors.danger,
  backgroundColor: () => colors.primary,
};

export const colorMixin = () => ({ color: colors.primary, backgroundColor: colors.danger });
