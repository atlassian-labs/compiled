import { styled } from '@compiled/react';

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
      <div>
        background-color: (&#123; color &#125;) =&gt; color; (when color=&ldquo;{propColor}&rdquo;)
      </div>
    </Component>
  );
};
