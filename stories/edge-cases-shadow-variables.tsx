import { styled } from '@compiled/react';
import { useEffect } from 'react';

export default {
  title: 'edge cases/shadow variables',
};

export const ClashingVariableNames = (): JSX.Element => {
  const color = 'white';
  const propColor = 'cadetblue';

  const Component = styled.div<{ color: string }>({
    color,
    backgroundColor: ({ color }) => color,
    padding: '10px',
  });

  return (
    <Component color={propColor}>
      <div>color: const color = &lsquo;{color}&rsquo;;</div>
      <br />
      <i>When color=&ldquo;{propColor}&rdquo;</i>
      <div>background-color: (&#123; color &#125;) =&gt; color;</div>
    </Component>
  );
};

type ThisWindow = Window & { color?: string };

export const ClashingInternalNames = (): JSX.Element => {
  const thisWindow: ThisWindow = window;
  thisWindow.color = 'purple';

  const props = {
    color: thisWindow.color,
  };
  const style = {
    color: thisWindow.color,
  };
  const propColor = 'pink';

  const Component = styled.div<{ color: string }>({
    color: () => props.color,
    border: '1px solid',
    borderColor: style.color,
    backgroundColor: (props) => props.color,
    padding: '10px',
  });

  useEffect(() => () => {
    delete thisWindow.color;
  });

  return (
    <Component color={propColor}>
      <i>When shadow props.color = window.color</i>
      <div>color: () =&gt; props.color;</div>
      <br />
      <i>When shadow style.color = window.color</i>
      <div>border-color: style.color;</div>
      <br />
      <i>When prop color=&ldquo;{propColor}&rdquo;</i>
      <div>background-color: (&#123; color &#125;) =&gt; color;</div>
    </Component>
  );
};
