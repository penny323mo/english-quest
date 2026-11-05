// The microphone must never be left on (review finding 2): a double tap while the
// permission prompt is open, a stream that arrives after the screen closed, a recorder
// that fails to start, and closing mid-recording all end with every track stopped.
import assert from "node:assert/strict";
import test from "node:test";
import { createMic } from "../web/src/recorder.mjs";

function fakeStream() {
  const tracks = [{ stopped: false, stop() { this.stopped = true; } }, { stopped: false, stop() { this.stopped = true; } }];
  return { tracks, getTracks: () => tracks, get live() { return tracks.some((t) => !t.stopped); } };
}

class FakeRecorder {
  constructor(stream, { failStart = false } = {}) {
    this.stream = stream;
    this.state = "inactive";
    this.mimeType = "audio/webm";
    this.failStart = failStart;
    this.ondataavailable = null;
    this.onstop = null;
  }
  start() {
    if (this.failStart) throw new Error("NotSupportedError");
    this.state = "recording";
  }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["take"]) });
    this.onstop?.();
  }
}

/** getStream resolves only when the test says the user answered the prompt. */
function harness({ makeRecorder } = {}) {
  const asks = [];
  const streams = [];
  const events = [];
  const mic = createMic({
    getStream: () =>
      new Promise((resolve, reject) => {
        asks.push({
          allow() {
            const s = fakeStream();
            streams.push(s);
            resolve(s);
          },
          deny() {
            reject(new Error("NotAllowedError"));
          },
        });
      }),
    makeRecorder: makeRecorder || ((stream) => new FakeRecorder(stream)),
    onStart: () => events.push("start"),
    onTake: (blob) => events.push(`take:${blob.size}`),
    onError: () => events.push("error"),
  });
  return { mic, asks, streams, events };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test("a normal take: start, stop, the take arrives and the microphone is off", async () => {
  const h = harness();
  const started = h.mic.start();
  h.asks[0].allow();
  assert.equal(await started, true);
  assert.equal(h.mic.recording, true);
  h.mic.stop();
  assert.deepEqual(h.events, ["start", "take:4"]);
  assert.equal(h.streams[0].live, false);
  assert.equal(h.mic.recording, false);
});

test("a second tap while the prompt is open does not ask again or open a second stream", async () => {
  const h = harness();
  const first = h.mic.start();
  assert.equal(h.mic.pending, true);
  assert.equal(await h.mic.start(), false);
  assert.equal(h.asks.length, 1);
  h.asks[0].allow();
  await first;
  assert.equal(h.streams.length, 1);
  h.mic.stop();
  assert.equal(h.streams[0].live, false);
});

test("a stream that arrives after the screen closed is stopped at once", async () => {
  const h = harness();
  const started = h.mic.start();
  h.mic.dispose();
  h.asks[0].allow();
  assert.equal(await started, false);
  assert.equal(h.streams[0].live, false);
  assert.deepEqual(h.events, [], "no recording starts and no state is set after closing");
});

test("stopping, or switching mode, while the prompt is open cancels that start", async () => {
  const h = harness();
  const started = h.mic.start();
  h.mic.stop();
  assert.equal(h.mic.pending, true, "still waiting, so a new tap cannot open a second prompt");
  assert.equal(await h.mic.start(), false);
  h.asks[0].allow();
  assert.equal(await started, false);
  assert.equal(h.streams[0].live, false);
  assert.equal(h.mic.pending, false);
  // The next tap works normally.
  const again = h.mic.start();
  h.asks[1].allow();
  assert.equal(await again, true);
  h.mic.stop();
  assert.equal(h.streams[1].live, false);
});

test("if the recorder cannot be made, the stream is stopped", async () => {
  const h = harness({ makeRecorder: () => { throw new Error("NotSupportedError"); } });
  const started = h.mic.start();
  h.asks[0].allow();
  assert.equal(await started, false);
  assert.equal(h.streams[0].live, false);
  assert.deepEqual(h.events, ["error"]);
  assert.equal(h.mic.recording, false);
});

test("if the recorder cannot start, the stream is stopped", async () => {
  const h = harness({ makeRecorder: (stream) => new FakeRecorder(stream, { failStart: true }) });
  const started = h.mic.start();
  h.asks[0].allow();
  assert.equal(await started, false);
  assert.equal(h.streams[0].live, false);
  assert.deepEqual(h.events, ["error"]);
});

test("a denied prompt reports an error and a later tap can ask again", async () => {
  const h = harness();
  const denied = h.mic.start();
  h.asks[0].deny();
  assert.equal(await denied, false);
  assert.deepEqual(h.events, ["error"]);
  const again = h.mic.start();
  assert.equal(h.asks.length, 2);
  h.asks[1].allow();
  assert.equal(await again, true);
  h.mic.dispose();
  assert.equal(h.streams[0].live, false);
});

test("closing the screen mid-recording stops the stream and drops the take", async () => {
  const h = harness();
  const started = h.mic.start();
  h.asks[0].allow();
  await started;
  h.mic.dispose();
  await tick();
  assert.equal(h.streams[0].live, false);
  assert.deepEqual(h.events, ["start"], "no take is delivered to a closed screen");
  assert.equal(await h.mic.start(), false, "a closed screen cannot start again");
});
