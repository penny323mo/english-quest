export function stopTracks(stream: MediaStream | null | undefined): void;
export function createMic(deps: {
  getStream: () => Promise<MediaStream>;
  makeRecorder: (stream: MediaStream) => MediaRecorder;
  onStart?: () => void;
  onTake?: (blob: Blob) => void;
  onError?: (error: unknown) => void;
}): {
  start(): Promise<boolean>;
  stop(): void;
  dispose(): void;
  readonly pending: boolean;
  readonly recording: boolean;
};
