import { styled } from '@compiled/react';
import { useState } from 'react';

export default {
  title: 'edge cases/ordering',
};

const Button = styled.a`
  @media (min-width: 10px) {
    color: orange;
  }
`;

const Link = styled.a`
  @media (min-width: 20px) {
    && {
      color: red;
    }
  }

  @media (min-width: 10px) {
    color: orange;
  }
`;

const MediaOrder = () => {
  const [renderLink, setRenderLink] = useState(false);
  const [renderButton, setRenderButton] = useState(false);

  return (
    <>
      <label>
        <input
          type="checkbox"
          onChange={() => setRenderLink((prev) => !prev)}
          checked={renderLink}
        />
        Render link
      </label>

      <label>
        <input
          type="checkbox"
          onChange={() => setRenderButton((prev) => !prev)}
          checked={renderButton}
        />
        Render button
      </label>

      {renderLink && (
        <div>
          <Link>Hello link</Link>
        </div>
      )}
      {renderButton && (
        <div>
          <Button>Hello button</Button>
        </div>
      )}
    </>
  );
};

export const MediaOrdering = (): JSX.Element => {
  return <MediaOrder />;
};
