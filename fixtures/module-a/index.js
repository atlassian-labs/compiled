export const colors = {
  primary: 'purple',
  danger: 'orange',
};

const fontSize = (() => 12)();

export const objectStyles = {
  fontSize,
  color: colors.danger,
  backgroundColor: (bgColor) => bgColor,
};

export const colorMixin = (radius) => ({
  color: colors.primary,
  backgroundColor: colors.danger,
  borderRadius: radius,
});
