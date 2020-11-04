jest.disableAutomock();

const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

import transformer from '../emotion-to-compiled';

describe('emotion-to-compiled transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import styled from '@emotion/styled';",
    "import { styled } from '@compiled/core';",
    'it transforms default @emotion/styled imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import sc from '@emotion/styled';",
    "import { styled as sc } from '@compiled/core';",
    'it transforms default with different name than "styled" @emotion/styled imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css, jsx } from '@emotion/core';
    `,
    `
    import React from 'react';
    import '@compiled/core';
    `,
    'it transforms all named @emotion/core imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css as c, jsx } from '@emotion/core';
    `,
    `
    import React from 'react';
    import '@compiled/core';
    `,
    'it transforms all named @emotion/core imports with different imported name'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css, jsx } from '@emotion/core';
    import styled from '@emotion/styled';
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';
    `,
    'it transforms all named @emotion/core and default @emotion/styled imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css as c, jsx } from '@emotion/core';
    import sc from '@emotion/styled';
    `,
    `
    import React from 'react';
    import { styled as sc } from '@compiled/core';
    `,
    'it transforms all named @emotion/core with different imported name and default with different name than "styled" @emotion/styled imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css, jsx } from '@emotion/core';
    import styled from '@emotion/styled';

    const Component = (props) => (
      <>
        <div
          css={css\`
            color: red;
            background-color: #000;
          \`}
        />
        <span css={css\` color: blue; \`} />
      </>
    );
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';

    const Component = (props) => (
      <>
        <div
          css={\`
            color: red;
            background-color: #000;
          \`}
        />
        <span css={\` color: blue; \`} />
      </>
    );
    `,
    'it transforms and removes named @emotion/core "css" tagged template literal'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css as c, jsx } from '@emotion/core';
    import styled from '@emotion/styled';

    const Component = (props) => (
      <>
        <div
          css={c\`
            color: red;
            background-color: #000;
          \`}
        />
        <span css={c\` color: blue; \`} />
      </>
    );
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';

    const Component = (props) => (
      <>
        <div
          css={\`
            color: red;
            background-color: #000;
          \`}
        />
        <span css={\` color: blue; \`} />
      </>
    );
    `,
    'it transforms and removes named @emotion/core with different imported name "css" tagged template literal'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { jsx } from '@emotion/core';
    import styled from '@emotion/styled';

    const Component = (props) => (
      <div
        css={{
          color: 'red',
          backgroundColor: props.background,
        }}
      />
    );
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';

    const Component = (props) => (
      <div
        css={{
          color: 'red',
          backgroundColor: props.background,
        }}
      />
    );
    `,
    'it should not transform when named @emotion/core "css" tagged template literal is not present'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { jsx } from '@emotion/core';
    import styled from '@emotion/styled';

    const Component = (props) => (
      <div
        css={\`
          color: red;
          background-color: #000;
        \`}
      />
    );
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';

    const Component = (props) => (
      <div
        css={\`
          color: red;
          background-color: #000;
        \`}
      />
    );
    `,
    'it should not transform when tagged template literal is not of type named @emotion/core "css"'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import _ from 'lodash';
    import { css, jsx } from '@emotion/core';
    `,
    `
    import React from 'react';
    import _ from 'lodash';
    import '@compiled/core';
    `,
    'it removes jsx pragma when @emotion/core is defined far from it'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import styled from '@emotion/styled';
    import { css, jsx } from '@emotion/core';
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';
    `,
    'it removes jsx pragma when @emotion/core is defined far from it and @emotion/styled is present'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css, jsx } from '@emotion/core';
    import styled from '@emotion/styled';
    import _ from 'lodash';
    `,
    `
    import React from 'react';
    import { styled } from '@compiled/core';
    import _ from 'lodash';
    `,
    'it ignores other imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { css, jsx } from '@emotion/core';
    import styled from '@emotion/styled';
    import _ from 'lodash';
    import { useState, useEffect } from 'react';
    `,
    `
    import { styled } from '@compiled/core';
    import _ from 'lodash';
    import React, { useState, useEffect } from 'react';
    `,
    'it adds `React` identifier to already imported react package if not present'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    /** @jsx jsx */
    import { ClassNames, CSSObject, css as c, jsx } from '@emotion/core';

    let cssObject: CSSObject = {};

    const Component = () => (
      <ClassNames>
        {({ css, cx }) => (
          <SomeComponent
            wrapperClassName={css({ color: 'green' })}
            css={c\`background-color: green \`}
            className={css\`
              color: hotpink;
            \`}
          >
            Hello
          </SomeComponent>
        )}
      </ClassNames>
    );
    `,
    `
    /* TODO: (from codemod) "ClassNames" is not exported from "@compiled/core" at the moment. Please find an alternative for it. */
    /* TODO: (from codemod) "CSSObject" is not exported from "@compiled/core" at the moment. Please find an alternative for it. */
    import React from 'react';
    import '@compiled/core';

    let cssObject: CSSObject = {};

    const Component = () => (
      <ClassNames>
        {({ css, cx }) => (
          <SomeComponent
            wrapperClassName={css({ color: 'green' })}
            css={\`background-color: green \`}
            className={css\`
              color: hotpink;
            \`}
          >
            Hello
          </SomeComponent>
        )}
      </ClassNames>
    );
    `,
    'it adds TODO comment for imports which are not resolved'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import React from 'react';",
    "import React from 'react';",
    'it should not transform when emotion imports are not present'
  );
});
