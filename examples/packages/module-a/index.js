export const colors = {
  primary: 'purple',
  danger: 'orange',
};

export const objectStyles = {
  fontSize: 12,
  color: colors.danger,
  backgroundColor: () => colors.primary,
};

export const colorMixin = () => ({ color: colors.primary, backgroundColor: colors.danger });
