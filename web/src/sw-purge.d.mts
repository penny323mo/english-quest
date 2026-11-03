export function planPrecachePurge(
  cachedUrls: string[],
  keepKeys: Iterable<string>,
): { remove: string[]; shellChanged: boolean };
