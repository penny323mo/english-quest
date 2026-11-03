export const SHELL_CACHE: string;
export function navigateNetworkFirst(
  request: { url: string },
  deps: {
    fetchImpl: typeof fetch;
    cachesImpl: CacheStorage;
    shellUrl: string;
    waitUntil?: (promise: Promise<unknown>) => void;
  },
): Promise<Response>;
