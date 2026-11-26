export const SHELL_CACHE: string;
export function navigateNetworkFirst(
  request: { url: string },
  deps: {
    fetchImpl: typeof fetch;
    cachesImpl: CacheStorage;
    shellUrl: string;
    keepPage?: (page: Response) => Promise<void>;
    waitUntil?: (promise: Promise<unknown>) => void;
  },
): Promise<Response>;
