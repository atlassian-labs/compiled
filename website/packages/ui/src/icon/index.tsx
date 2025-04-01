/** @jsxImportSource @compiled/react */
import { Github } from './github';
import { Logo } from './logo';
import { Npm } from './npm';

interface IconProps {
  name: keyof typeof iconMap;
}

const iconMap = {
  github: Github,
  logo: Logo,
  npm: Npm,
};

export const Icon = (props: IconProps): JSX.Element => {
  const Svg = iconMap[props.name];

  return (
    <span css={{ display: 'inline-block', width: '4rem', height: '4rem' }}>
      <Svg />
    </span>
  );
};

export { Logo } from './logo';
