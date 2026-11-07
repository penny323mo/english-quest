import { useEffect, useState } from "react";
import { buildLabel, compareBuild } from "./version.mjs";

const OWN = __EQ_BUILD__;
const CHECK_EVERY_MS = 60_000;

/**
 * Bottom-right: when this build was made (Macau time, month-day hour:minute) and its
 * commit, so it is clear
 * whether an old cached copy or the new deploy is open. Online, it asks the server for
 * version.json past every cache: 最新 when they match, 有新版本 (tap to reload) when the
 * server has a later build. Offline it just shows this build.
 */
export function VersionBadge({ place }: { place: "tabs" | "screen" }) {
  const [state, setState] = useState<"latest" | "newer" | "unknown">("unknown");
  const [server, setServer] = useState<{ time: string; sha: string } | null>(null);

  useEffect(() => {
    let last = 0;
    let alive = true;
    const check = async () => {
      if (Date.now() - last < CHECK_EVERY_MS) return;
      last = Date.now();
      // Any check that does not get an answer clears what an earlier one said: a past
      // 最新 says nothing about now.
      const unknown = () => {
        if (!alive) return;
        setServer(null);
        setState("unknown");
      };
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return unknown();
        const data = await res.json();
        if (!alive) return;
        setServer(data);
        setState(compareBuild(OWN, data));
      } catch {
        unknown(); // offline: show only this build
      }
    };
    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Month-day and time is enough to tell builds apart; the full date is in the tooltip.
  const full = `${buildLabel(OWN.time)} · ${OWN.sha}`;
  const label = full.slice(5);
  if (state === "newer" && server) {
    return (
      <button
        type="button"
        className={`version-badge newer at-${place}`}
        data-version="newer"
        title={`呢度係 ${full}，伺服器有 ${buildLabel(server.time)} · ${server.sha}`}
        onClick={() => location.reload()}
      >
        有新版本 · 撳更新
      </button>
    );
  }
  return (
    <span className={`version-badge at-${place}`} data-version={state} title={`版本 ${full}（澳門時間建立）`}>
      {label}
      {state === "latest" ? <span className="ok"> · 最新</span> : null}
    </span>
  );
}
