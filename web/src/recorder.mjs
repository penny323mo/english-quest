// Microphone recording that never leaves the microphone on (review finding 2).
// - A second tap while the permission prompt is still open does not ask again.
// - A stream that arrives after the lesson screen has closed is stopped at once.
// - If the recorder cannot be made or started, the stream is stopped.
// - Stopping, or switching away, while the prompt is open cancels that start.
// - Closing the screen mid-recording stops the stream and drops the take.

/** @param {MediaStream | null | undefined} stream */
export function stopTracks(stream) {
  try {
    stream?.getTracks().forEach((track) => track.stop());
  } catch {
    /* already stopped */
  }
}

/**
 * @param {{
 *   getStream: () => Promise<MediaStream>,
 *   makeRecorder: (stream: MediaStream) => MediaRecorder,
 *   onStart?: () => void,
 *   onTake?: (blob: Blob) => void,
 *   onError?: (error: unknown) => void,
 * }} deps
 */
export function createMic(deps) {
  let pending = false;
  let disposed = false;
  // Bumped by stop() and dispose(): a stream that arrives for an older start is unwanted.
  let generation = 0;
  /** @type {{ stream: MediaStream, recorder: MediaRecorder } | null} */
  let current = null;

  async function start() {
    if (pending || current || disposed) return false;
    pending = true;
    const mine = generation;
    /** @type {MediaStream} */
    let stream;
    try {
      stream = await deps.getStream();
    } catch (error) {
      pending = false;
      if (!disposed && mine === generation) deps.onError?.(error);
      return false;
    }
    pending = false;
    if (disposed || mine !== generation) {
      stopTracks(stream);
      return false;
    }
    /** @type {MediaRecorder} */
    let recorder;
    try {
      recorder = deps.makeRecorder(stream);
      /** @type {Blob[]} */
      const chunks = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        stopTracks(stream);
        if (current && current.recorder === recorder) current = null;
        if (disposed) return;
        deps.onTake?.(new Blob(chunks, { type: recorder.mimeType || "audio/mp4" }));
      };
      recorder.start();
    } catch (error) {
      stopTracks(stream);
      deps.onError?.(error);
      return false;
    }
    current = { stream, recorder };
    deps.onStart?.();
    return true;
  }

  function stop() {
    // A start still waiting for permission stays pending (so no second prompt opens)
    // and stops its stream when it arrives.
    generation += 1;
    if (!current) return;
    const { stream, recorder } = current;
    try {
      if (recorder.state !== "inactive") recorder.stop();
      else stopTracks(stream);
    } catch {
      stopTracks(stream);
    }
    current = null;
  }

  function dispose() {
    disposed = true;
    generation += 1;
    if (!current) return;
    const { stream, recorder } = current;
    current = null;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      /* already stopped */
    }
    stopTracks(stream);
  }

  return {
    start,
    stop,
    dispose,
    get pending() {
      return pending;
    },
    get recording() {
      return current !== null;
    },
  };
}
