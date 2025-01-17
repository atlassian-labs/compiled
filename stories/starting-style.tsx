/**
 * @jsxRuntime classic
 * @jsx jsx
 */
import { cssMap, jsx } from '@compiled/react';
import { useState } from 'react';

export default {
  title: 'atomic/starting style',
};

type SideNavState = 'flyout-open' | 'expanded' | 'collapsed' | 'flyout-collapsed';

export const Example = (): JSX.Element => {
  const [sideNavState, setSideNavState] = useState<SideNavState>('expanded');

  const handleSidebarToggle = () => {
    setSideNavState((currentState) => (currentState === 'expanded' ? 'collapsed' : 'expanded'));
  };

  const handleToggleButtonMouseEnter = () => {
    if (sideNavState !== 'collapsed' && sideNavState !== 'flyout-collapsed') {
      return;
    }

    setSideNavState('flyout-open');
  };

  const handleToggleButtonMouseLeave = () => {
    if (sideNavState !== 'flyout-open') {
      return;
    }

    setSideNavState('flyout-collapsed');
  };

  return (
    <div css={rootStyles.root}>
      <div css={topbarStyles.root}>
        <button
          onClick={handleSidebarToggle}
          onMouseEnter={handleToggleButtonMouseEnter}
          onMouseLeave={handleToggleButtonMouseLeave}>
          🍔
        </button>
      </div>

      <div
        css={[
          sidebarStyles.root,
          sideNavState === 'collapsed' && sidebarStyles.collapsed,
          sideNavState === 'flyout-open' && sidebarStyles.flyoutOpen,
          sideNavState === 'flyout-collapsed' && sidebarStyles.flyoutClosed,
          (sideNavState === 'flyout-open' || sideNavState === 'flyout-collapsed') &&
            sidebarStyles.flyoutAnimation,
        ]}>
        sidebar
      </div>
      <div css={mainStyles.root}>main</div>
    </div>
  );
};

const rootStyles = cssMap({
  root: {
    margin: '-16px', // Removing default storybook margin
    display: 'grid',
    gridTemplateAreas: `
      "topbar topbar"
      "sidebar main"
    `,
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gridTemplateRows: 'auto 1fr',
    minHeight: '100vh',
  },
});

const topbarStyles = cssMap({
  root: {
    gridArea: 'topbar',
    backgroundColor: '#aab99a',
    padding: '8px',
  },
});

const sidebarStyles = cssMap({
  root: {
    gridArea: 'sidebar',
    backgroundColor: '#d0ddd0',
    width: '320px',
    boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
  },
  collapsed: {
    display: 'none',
  },
  flyoutAnimation: {
    transitionProperty: 'transform, display',
    transitionDuration: '0.2s',
    transitionBehavior: 'allow-discrete',
  },
  flyoutOpen: {
    gridArea: 'main',
    // z-index is to overlay over main
    zIndex: 1,
    '@media (prefers-reduced-motion: no-preference)': {
      '@starting-style': {
        transform: 'translateX(-100%)',
      },
    },
  },
  flyoutClosed: {
    display: 'none',
    '@media (prefers-reduced-motion: no-preference)': {
      transform: 'translateX(-100%)',
      // use main's grid area to allow main to take side-nav's place in grid
      gridArea: 'main',
    },
  },
});

const mainStyles = cssMap({
  root: {
    gridArea: 'main',
    backgroundColor: '#f0f0d7',
  },
});
