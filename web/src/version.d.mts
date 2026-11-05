export type BuildInfo = { time: string; sha: string };
export function buildLabel(time: string): string;
export function compareBuild(own: BuildInfo | null, server: unknown): "latest" | "newer" | "unknown";
