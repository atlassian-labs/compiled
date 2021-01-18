export const colors: {
  primary: string;
  danger: string;
};

export const objectStyles: {
  fontSize: number;
  color: string;
  backgroundColor: (bgColor: string) => string;
};

export const colorMixin: (
  radius: number
) => {
  color: string;
  backgroundColor: string;
  borderRadius: number;
};
