/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { Content, HorizontalStack, Text } from '@compiled/website-ui';

export const Footer = (): JSX.Element => (
  <>
    <div css={{ height: 80 }} />
    <footer
      css={{
        padding: '4rem 0',
        fontSize: 11,
        background: '#FAFBFC',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        a: {
          color: 'currentColor',
          textDecoration: 'none',
        },
      }}>
      <Content>
        <Text variant="supplementary">
          <HorizontalStack css={{ textAlign: 'center' }} gap={3}>
            <a href="https://atlassian.com">© {new Date().getFullYear()} Atlassian</a>
            <a href="https://www.atlassian.com/company/careers">Careers</a>
            <a href="https://www.atlassian.com/legal/trademark">Trademark</a>
            <a href="https://www.atlassian.com/legal/privacy-policy">Privacy</a>
            <a href="https://github.com/atlassian-labs/compiled/blob/master/LICENSE">License</a>
          </HorizontalStack>
        </Text>
      </Content>
    </footer>
  </>
);
