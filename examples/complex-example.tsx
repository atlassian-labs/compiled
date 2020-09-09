import * as React from 'react';
import '@compiled/core';
import AdsLogo from './components/ads';

export default {
  title: 'complex',
};

const Button = ({ children }: any) => (
  <button
    css={{
      padding: '8px 12px',
      color: '#fff',
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: 14,
      borderRadius: 3,
      ':hover': {
        background: 'rgba(116,118,121,0.6)',
      },
    }}>
    {children}
  </button>
);

const Header = ({ children }: any) => (
  <header
    css={{
      paddingLeft: '16px',
      backgroundColor: '#091e42',
      height: 56,
      display: 'flex',
      alignItems: 'center',
    }}>
    {children}
  </header>
);

const Actions = ({ children, className }: any) => <nav className={className}>{children}</nav>;

const Content = ({ children, className }: any) => (
  <div
    className={className}
    css={{
      padding: '40px 0',
      display: 'flex',
      alignItems: 'center',
      margin: '0 auto',
      maxWidth: 1200,
    }}>
    {children}
  </div>
);

const CharlieFont = ({ children, className }: any) => (
  <span
    className={className}
    css={{
      display: 'block',
      fontFamily:
        '"Charlie Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    }}>
    {children}
  </span>
);

const Hero = () => (
  <div
    css={{
      height: 450,
      backgroundColor: '#FAFBFC',
      display: 'flex',
      alignItems: 'center',
    }}>
    <Content>
      <div>
        <CharlieFont css={{ fontSize: 52, color: 'rgb(23, 43, 77)', marginBottom: 16 }}>
          Design, develop, deliver
        </CharlieFont>
        <CharlieFont css={{ fontSize: 24, color: '#5E6C84' }}>
          Use Atlassian’s end-to-end design language to create simple, intuitive and beautiful
          experiences.
        </CharlieFont>
      </div>
      <div css={{ width: 560 }}></div>
    </Content>
  </div>
);

const P = ({ children, className }: any) => (
  <p
    className={className}
    css={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    }}>
    {children}
  </p>
);

const Card = ({ title, description, cta, className }: any) => (
  <div className={className}>
    <CharlieFont css={{ fontSize: 24, marginBottom: 16 }}>{title}</CharlieFont>
    <P
      css={{
        marginBottom: 16,
        color: '#5E6C84',
        fontWeight: 300,
      }}>
      {description}
    </P>
    {cta && <P css={{ fontSize: 14, color: 'rgb(0, 82, 204)' }}>{cta} →</P>}
  </div>
);

const HeroCard = ({ className, ...props }: any) => (
  <div
    className={className}
    css={{ overflow: 'hidden', borderRadius: 3, display: 'flex', backgroundColor: '#fff' }}>
    <div css={{ width: 225, backgroundColor: '#FAFBFC' }} />
    <Card css={{ padding: 40 }} {...props} />
  </div>
);

const HGroup = ({ children }: any) => (
  <div css={{ display: 'flex', borderBottom: '1px solid #DFE1E6', padding: '40px 0' }}>
    {children}
  </div>
);

const ResourceCard = ({ children, className, ...props }: any) => (
  <div
    className={className}
    css={{
      backgroundColor: 'white',
      padding: 24,
      minHeight: '272px',
      width: 251,
      marginLeft: 16,
      flexGrow: 0,
      boxShadow: '0 1px 1px rgba(9,30,66,0.25),0 0 1px 0 rgba(9,30,66,0.31)',
    }}>
    <Card {...props} />
  </div>
);

const GroupCard = (props: any) => <Card {...props} css={{ maxWidth: '32%', marginRight: 32 }} />;

export const ComplexExample = () => {
  return (
    <>
      <Header>
        <AdsLogo />

        <Actions css={{ marginLeft: 48 }}>
          <Button>Brand</Button>
          <Button>Foundations</Button>
          <Button>Content</Button>
          <Button>Components</Button>
          <Button>Patterns</Button>
          <Button>Resources</Button>
        </Actions>
      </Header>

      <main>
        <Hero />

        <div css={{ backgroundColor: '#172B4D' }}>
          <Content>
            <HeroCard
              css={{ marginRight: 10, width: '50%' }}
              title="Components"
              description="Components are the intuitive building blocks of our design system."
              cta="Explore our components"
            />
            <HeroCard
              css={{ marginLeft: 10, width: '50%' }}
              title="Patterns"
              description="Patterns are reusable combinations of our components that solve common user problems."
              cta="Explore our patterns"
            />
          </Content>
        </div>

        <Content>
          <div css={{ width: '100%' }}>
            <HGroup>
              <GroupCard
                title="Brand"
                description="Our brand reflects who we are and how we want our users to feel when they use our products."
                cta="Explore our brand"
              />
              <ResourceCard
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                title="Personality"
                description="Our personality describes the tone we use for external communications. It should be expressed as an embodiment of our values."
              />
              <ResourceCard
                title="Promise"
                description="Our promise is that our tools and practices will help teams work better together in an agile, open, and scalable way."
              />
            </HGroup>
            <HGroup>
              <GroupCard
                title="Foundations"
                description="Foundations are the visual elements needed to create engaging layouts and end-to-end user experiences."
                cta="Explore our foundations"
              />
              <ResourceCard
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                title="Personality"
                description="Our personality describes the tone we use for external communications. It should be expressed as an embodiment of our values."
              />
              <ResourceCard
                title="Promise"
                description="Our promise is that our tools and practices will help teams work better together in an agile, open, and scalable way."
              />
            </HGroup>
            <HGroup>
              <GroupCard
                title="Content"
                description="Our content guidance covers our voice and tone, and the mechanics of our grammar and style."
                cta="Explore content guidance"
              />
              <ResourceCard
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                title="Personality"
                description="Our personality describes the tone we use for external communications. It should be expressed as an embodiment of our values."
              />
              <ResourceCard
                title="Promise"
                description="Our promise is that our tools and practices will help teams work better together in an agile, open, and scalable way."
              />
            </HGroup>
          </div>
        </Content>

        <div css={{ backgroundColor: '#F4F5F7' }}>
          <Content css={{ display: 'block' }}>
            <CharlieFont css={{ textAlign: 'center', fontSize: 36 }}>Resources</CharlieFont>
            <P css={{ textAlign: 'center' }}>
              A collection of tools, kits, plugins and guides to help simplify the creation process
              for our users.
            </P>

            <Content css={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
              <ResourceCard
                css={{ marginBottom: 24 }}
                title="Mission"
                description="Our mission is to unleash the potential in every team."
              />
            </Content>
          </Content>
        </div>
      </main>

      <footer
        css={{
          fontSize: 10,
          color: 'white',
          backgroundColor: '#172b4d',
          padding: 24,
          textAlign: 'center',
        }}>
        © 2020 AtlassianCareersTrademarkPrivacyLicense
      </footer>
    </>
  );
};
