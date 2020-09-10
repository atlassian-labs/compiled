export const colors: {
  primary: string;
  danger: string;
};

export const objectStyles: {
  fontSize: number;
  color: string;
  backgroundColor: () => string;
};

export const colorMixin: () => {
  color: string;
  backgroundColor: string;
};
