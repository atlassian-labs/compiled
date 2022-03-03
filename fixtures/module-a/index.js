export const colors = {
  danger: 'orange',
  primary: 'purple',
};

const fontSize = (() => 12)();

export const objectStyles = {
  backgroundColor: (bgColor) => bgColor,
  color: colors.danger,
  fontSize,
};

export const colorMixin = (radius) => ({
  backgroundColor: colors.danger,
  borderRadius: radius,
  color: colors.primary,
});
