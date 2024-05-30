/** @jsxImportSource @compiled/react */
import { Text, colors } from '@compiled/website-ui';
import type {
  Ref} from 'react';
import {
  createContext,
  useContext,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useState
} from 'react';

interface AnchorContextData {
  listen: (element: HTMLElement) => void;
  unlisten: (element: HTMLElement) => void;
  selected: string;
}

const AnchorContext = createContext<AnchorContextData>({
  listen: () => {},
  unlisten: () => {},
  selected: '',
});

export const Anchor = ({ children }: { children: string | string[] }) => {
  const context = useContext(AnchorContext);
  const ref = useRef<HTMLElement | null>(null);

  const id = (
    typeof children === 'string'
      ? [children.trim().split(' ').join('-')]
      : // Somehow children arrays could END with a space.
        children.filter(
          (text, index) => !(index === children.length - 1 && text === ' ')
        )
  )
    .filter((child) => typeof child === 'string')
    .map((child) => child.trim().split(' ').join('-'))
    .join('-')
    .toLowerCase();

  useEffect(() => {
    context.listen(ref.current);

    return () => {
      context.unlisten(ref.current);
    };
  }, [context, id]);

  return (
    <a
      ref={ref as Ref<HTMLAnchorElement>}
      href={`#${id}`}
      id={id}
      css={{
        color: 'currentColor',
        textDecoration: 'none',
        position: 'relative',
        ':before': {
          opacity: 0,
          content: '🔗',
          position: 'absolute',
          left: '-4rem',
          fontSize: '3rem',
          transform: 'translateX(1rem)',
          transition: 'opacity 100ms, transform 100ms',
          paddingRight: '5rem',
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
        },
        ':hover,:focus': {
          ':before': {
            opacity: 1,
            transform: 'none',
          },
        },
      }}>
      {children}
    </a>
  );
};

export const ToAnchor = ({
  children,
  depth,
}: {
  children: string;
  depth: number;
}) => {
  const id = children.trim().split(' ').join('-').toLowerCase();
  const context = useContext(AnchorContext);

  return (
    <Text
      as="div"
      variant="supplementary"
      css={{ paddingLeft: `${depth - 1}rem` }}>
      <a
        css={{
          color: context.selected === id ? colors.primary : 'currentColor',
          transition: 'color 100ms',
          textDecoration: 'none',
          ':hover,:focus': {
            cursor: 'pointer',
            color: colors.primary,
          },
          ':active': {
            opacity: 0.8,
          },
        }}
        href={`#${id}`}>
        {children}
      </a>
    </Text>
  );
};

export const AnchorProvider = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => {
  const observer = useRef<IntersectionObserver>();
  const [selected, setSelected] = useState('');

  const listen = useCallback((element: HTMLElement) => {
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          let target: Element;

          entries
            .filter((entry) => entry.intersectionRatio >= 1)
            .forEach((entry) => {
              target = entry.target;
            });

          if (target) {
            setSelected(target.id);
          }
        },
        { rootMargin: '0px 0px -60% 0px', threshold: [1] }
      );
    }

    observer.current.observe(element);
  }, []);

  const unlisten = useCallback((element: HTMLElement | null) => {
    if (element) {
      observer.current.unobserve(element);
    }
  }, []);

  const value = useMemo(
    () => ({ listen, unlisten, selected }),
    [listen, unlisten, selected]
  );

  useEffect(() => {
    return () => {
      observer.current.disconnect();
    };
  }, []);

  return (
    <AnchorContext.Provider value={value}>{children}</AnchorContext.Provider>
  );
};
