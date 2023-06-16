export function makeDim(text: string): string {
  return '\x1b[2m' + text + '\x1b[0m';
}

export function makeItalic(text: string): string {
  return '\x1b[3m' + text + '\x1b[0m';
}
