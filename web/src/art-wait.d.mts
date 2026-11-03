export const ART_WAIT_MS: number;
export function waitForImages(
  urls: string[],
  options: {
    minWidth?: number;
    timeoutMs?: number;
    makeImage: () => HTMLImageElement;
    setTimer?: (fn: () => void, ms: number) => unknown;
  },
): Promise<void>;
