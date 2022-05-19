import { primary } from './simple';

export const bold = `
  font-size: 12px;
  font-weight: bold;
`;

const fontSize = 16;

export const italics = `
  font-size: ${fontSize}px;
  font-weight: italic;
`;

export const danger = `
  color: ${primary};
  font-size: 10px;
`;

export const ID_SELECTOR = '#id-selector';

const id = 'joined-selector';

export const JOINED_SELECTOR = `#${id}`;
