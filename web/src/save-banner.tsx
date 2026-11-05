import { takeOver, useStore } from "./store";

/**
 * Save status: paused (another tab saves), conflict (the latest copy was loaded),
 * or unsaved. Shown in the shell and on onboarding, which renders outside the shell:
 * a fresh tab can be paused before it has a profile, and its 開始 does not save then.
 */
export function SaveBanner() {
  const status = useStore((s) => s.saveStatus);
  const paused = useStore((s) => s.paused);
  const retrySave = useStore((s) => s.retrySave);
  if (paused) {
    return (
      <div className="save-banner" role="status" data-save="paused">
        <p><strong>呢個分頁暫停咗</strong> 你喺另一個分頁用緊，呢度唔會儲存，免得蓋過嗰邊嘅進度。</p>
        <button className="btn quiet" type="button" onClick={() => void takeOver()}>喺呢度繼續</button>
      </div>
    );
  }
  if (status.kind === "conflict") {
    return (
      <div className="save-banner" role="status" data-save="conflict">
        <p><strong>已載入最新進度</strong> {status.reason}</p>
        <button className="btn quiet" type="button" onClick={() => useStore.setState({ saveStatus: { kind: "ok" } })}>知道</button>
      </div>
    );
  }
  if (status.kind !== "unsaved") return null;
  return (
    <div className="save-banner" role="status">
      <p><strong>未儲存</strong> {status.reason}</p>
      <button className="btn quiet" type="button" onClick={() => retrySave()}>再試</button>
    </div>
  );
}
