export declare const EXTRAS_CACHE: string;
export declare function isExtraClip(url: string): boolean;
export declare function extraKey(url: string, revision: string | null | undefined): string;
export declare function planExtrasPurge(cachedUrls: string[], keepKeys: Iterable<string>): string[];
