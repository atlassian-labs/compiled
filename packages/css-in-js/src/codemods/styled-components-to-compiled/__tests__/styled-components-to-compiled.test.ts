jest.disableAutomock();

const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

import transformer from '../styled-components-to-compiled';

describe('styled-components-to-compiled transformer', () => {
  defineInlineTest(
    transformer,
    {},
    "import styled from 'styled-components';",
    "import { styled } from '@compiled/css-in-js';",
    'it transforms default styled-components imports'
  );

  defineInlineTest(
    transformer,
    {},
    "import sc from 'styled-components';",
    "import { styled as sc } from '@compiled/css-in-js';",
    'it transforms default with different name than "styled" styled-components imports'
  );

  defineInlineTest(
    transformer,
    {},
    `
    import styled from 'styled-components';
    import react from 'react';
    `,
    `
    import { styled } from '@compiled/css-in-js';
    import react from 'react';
    `,
    'it ignores other imports'
  );

  defineInlineTest(
    transformer,
    {},
    "import react from 'react';",
    "import react from 'react';",
    'it should not transform when styled-components imports are not present'
  );
});
