export const colors: {
  primary: string;
  danger: string;
};

export const objectStyles: {
  fontSize: number;
  color: string;
  backgroundColor: (bgColor?: string) => string | undefined;
};

export const colorMixin: (radius: number) => {
  color: string;
  backgroundColor: string;
  borderRadius: number;
};
