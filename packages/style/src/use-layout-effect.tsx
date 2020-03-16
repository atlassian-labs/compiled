import { useEffect, useLayoutEffect as useLayEffect } from 'react';

export const useLayoutEffect = typeof window === 'undefined' ? useEffect : useLayEffect;
