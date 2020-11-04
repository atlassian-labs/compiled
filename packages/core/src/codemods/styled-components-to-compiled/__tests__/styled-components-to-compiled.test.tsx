jest.disableAutomock();

const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

import transformer from '../styled-components-to-compiled';

describe('styled-components-to-compiled transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import styled from 'styled-components';",
    "import { styled } from '@compiled/core';",
    'it transforms default styled-components imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import sc from 'styled-components';",
    "import { styled as sc } from '@compiled/core';",
    'it transforms default with different name than "styled" styled-components imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    `
    import styled from 'styled-components';
    import React from 'react';
    `,
    `
    import { styled } from '@compiled/core';
    import React from 'react';
    `,
    'it ignores other imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {},
    "import React from 'react';",
    "import React from 'react';",
    'it should not transform when styled-components imports are not present'
  );
});
