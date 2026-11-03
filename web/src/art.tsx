import { useEffect, useState } from "react";
import { ART_WAIT_MS, waitForImages } from "./art-wait.mjs";

const warmed = new Set<string>();
const loaded = new Set<string>();

export function preloadArt(urls: string[]) {
  for (const url of urls) {
    if (!url || warmed.has(url)) continue;
    warmed.add(url);
    const img = new Image();
    img.decoding = "sync";
    img.onload = () => loaded.add(url);
    img.src = url;
    if (img.complete && img.naturalWidth > 0) loaded.add(url);
  }
}

/**
 * Resolves once every image has decoded, failed, or the wait ran out.
 * A missing or broken image must not leave 入去場景 disabled for good.
 */
export function whenArtDecoded(urls: string[], minWidth = 1, timeoutMs = ART_WAIT_MS): Promise<void> {
  return waitForImages(urls, { minWidth, timeoutMs, makeImage: () => new Image() });
}

export function ArtImg({
  src,
  alt,
  width,
  height,
  fill = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  fill?: boolean;
}) {
  const [ready, setReady] = useState(() => loaded.has(src));
  useEffect(() => {
    if (loaded.has(src)) {
      setReady(true);
      return;
    }
    let live = true;
    const img = new Image();
    const readyNow = () => {
      if (img.naturalWidth <= 0) return;
      loaded.add(src);
      if (live) setReady(true);
    };
    img.onload = readyNow;
    img.src = src;
    if (img.complete) readyNow();
    return () => {
      live = false;
    };
  }, [src]);
  return (
    <span className={ready ? "art-ph is-ready" : "art-ph"} data-fill={fill ? "1" : undefined}>
      <img src={src} alt={alt} width={width} height={height} loading="eager" fetchPriority={fill ? "high" : "auto"} />
    </span>
  );
}
