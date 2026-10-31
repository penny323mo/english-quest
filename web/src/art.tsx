import { useEffect, useState } from "react";

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
    img.onload = () => {
      loaded.add(src);
      if (live) setReady(true);
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      loaded.add(src);
      setReady(true);
    }
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
