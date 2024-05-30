/** @jsxImportSource @compiled/react */
import { Github } from './github';
import { Npm } from './npm';

interface IconProps {
  name: keyof typeof iconMap;
}

const iconMap = {
  github: Github,
  npm: Npm,
};

export const Icon = (props: IconProps) => {
  const Svg = iconMap[props.name];

  return (
    <span css={{ display: 'inline-block', width: '4rem', height: '4rem' }}>
      <Svg />
    </span>
  );
};
