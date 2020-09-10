export default function ax(className: string) {
  const found: any = {};

  className.split(' ').forEach((cls) => {
    const index = cls.charAt(0) === '_' ? 5 : 4;
    const part = cls.slice(0, index);
    found[part] = cls;
  });

  return Object.values(found).join(' ');
}
