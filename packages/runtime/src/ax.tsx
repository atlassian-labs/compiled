export default function ax(className: string) {
  const found: any = {};

  className.split(' ').forEach((cls) => {
    const part = cls.split('-')[1];
    found[part] = cls;
  });

  return Object.values(found).join(' ');
}
