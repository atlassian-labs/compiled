/** @jsx jsx */
import { jsx } from '@emotion/core';
import * as React from 'react';
import { InteractionTaskArgs, PublicInteractionTask } from 'storybook-addon-performance';
import { fireEvent, findAllByText } from '@testing-library/dom';

export default {
  title: 'benchmarks | emotion',
};

const APPEARANCES = [
  { bg: 'red', color: 'white' },
  { bg: 'blue', color: 'white' },
  { bg: 'green', color: 'black' },
  { bg: 'grey', color: 'white' },
  { bg: 'yellow', color: 'black' },
  { bg: 'orange', color: 'white' },
];

const interactionTasks: PublicInteractionTask[] = [
  {
    name: 'Display lozenge',
    run: async ({ container }: InteractionTaskArgs): Promise<void> => {
      window.location.reload();

      const buttonAll = container.querySelectorAll('button')!;

      buttonAll.forEach((button) => {
        fireEvent.click(button);
      });

      await findAllByText(container, 'Lozenge', undefined, {
        timeout: 2000,
      });
    },
  },
];

const Row: React.FunctionComponent<React.ReactNode> = ({ children }) => (
  <div style={{ display: 'flex' }}>{children}</div>
);

const Col: React.FunctionComponent<React.ReactNode> = ({ children }) => (
  <div style={{ flex: '1 1 auto' }}>{children}</div>
);

const Lozenge = (props: { bg: string; color: string }) => (
  <span
    css={{
      backgroundColor: props.bg,
      borderRadius: 3,
      boxSizing: 'border-box',
      color: props.color,
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 700,
      lineHeight: 1,
      maxWidth: '100%',
      padding: '2px 0 3px 0',
      textTransform: 'uppercase',
      verticalAlign: 'baseline',
    }}>
    <span
      css={{
        display: 'inline-block',
        verticalAlign: 'top',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        padding: `0 4px`,
        maxWidth: 100,
        width: '100%',
      }}>
      Lozenge
    </span>
  </span>
);

export const Dynamic = () => {
  const [toggle, setToggle] = React.useState(false);

  return (
    <React.Fragment>
      <button onClick={() => setToggle(!toggle)}>Toggle</button>
      {toggle && (
        <div>
          <Row>
            <Col>
              <p>Colors</p>
              {APPEARANCES.map((a) => (
                <p key={a.bg as string}>
                  <Lozenge bg={a.bg} color={a.color} />
                </p>
              ))}
            </Col>
          </Row>
        </div>
      )}
    </React.Fragment>
  );
};

Dynamic.story = {
  name: 'Emotion Dynamic',
  parameters: {
    performance: {
      interactions: interactionTasks,
    },
  },
};
