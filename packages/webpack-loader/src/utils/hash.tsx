import type { Compilation } from 'webpack';
import { util } from 'webpack';

export function hash(content: string, outputOptions: Compilation['outputOptions']): string {
  const { hashFunction, hashDigest, hashDigestLength } = outputOptions;
  const hasher = util.createHash(hashFunction!);
  hasher.update(content);

  return (hasher.digest(hashDigest) as string).substring(0, hashDigestLength);
}
