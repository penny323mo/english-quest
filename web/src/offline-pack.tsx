import { useEffect, useState } from "react";
import { installCourseWorker, isTrial } from "./course-worker";

type Pack = { state: "manual" | "checking" | "downloading" | "failed" | "ready" | "unavailable" | "updating"; completed: number; total: number; reason?: string; entry?: string };
const initial: Pack = { state: "checking", completed: 0, total: 0 };

export function OfflinePack() {
  const [pack, setPack] = useState<Pack>(initial);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let timer = 0;
    let channel: MessageChannel | undefined;
    let requestRetry = retry > 0;
    const workers = navigator.serviceWorker;
    function poll() {
      window.clearTimeout(timer);
      channel?.port1.close();
      const worker = workers?.controller;
      if (!worker) {
        if (workers && requestRetry) {
          requestRetry = false;
          setPack(initial);
          const unavailable = () => {
            if (active && !workers.controller) setPack({ ...initial, state: "unavailable" });
          };
          timer = window.setTimeout(unavailable, 15000);
          void installCourseWorker().catch(unavailable);
        } else {
          setPack({ ...initial, state: workers && isTrial ? "manual" : "unavailable" });
        }
        return;
      }
      channel = new MessageChannel();
      channel.port1.onmessage = ({ data }: MessageEvent<Pack>) => {
        if (!active) return;
        window.clearTimeout(timer);
        channel?.port1.close();
        const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
        const state = data.state === "ready" && data.entry && script && script.src !== data.entry ? "updating" : data.state;
        setPack({ ...data, state });
        if (state === "checking" || state === "downloading") timer = window.setTimeout(poll, 1200);
      };
      timer = window.setTimeout(() => {
        channel?.port1.close();
        if (active) setPack({ ...initial, state: "unavailable" });
      }, 8000);
      worker.postMessage({ type: requestRetry ? "eq-pack-retry" : "eq-pack-status" }, [channel.port2]);
      requestRetry = false;
    }
    poll();
    workers?.addEventListener("controllerchange", poll);
    return () => {
      active = false;
      window.clearTimeout(timer);
      channel?.port1.close();
      workers?.removeEventListener("controllerchange", poll);
    };
  }, [retry]);
  const text = {
    manual: "網上試玩會按需要載入課堂同錄音。想離線學習，可以用 Wi-Fi 下載全套，約 190 MB。",
    checking: "檢查緊呢部機嘅課程包",
    downloading: "正在下載課程同錄音",
    ready: "課程同錄音已齊備，可以離線學習。",
    failed: pack.reason === "quota" ? "儲存空間不足。騰出空間後可以重試。" : "下載中斷。連線後可以繼續。",
    unavailable: "暫時未能確認課程包，請連線後再檢查。",
    updating: "呢頁同離線版本唔同，重新開啟後可以再檢查。",
  }[pack.state];
  return <section className="stack" aria-label="離線學習">
    <h2>離線學習</h2>
    <p role="status">{text}</p>
    {pack.state === "manual" && <button className="btn ghost" type="button" onClick={() => setRetry(n => n + 1)}>下載完整課程包</button>}
    {pack.total > 0 && <p className="fine">已儲存 {pack.completed} / {pack.total} 個檔案</p>}
    {pack.state === "downloading" && pack.total > 0 && <progress aria-label="課程包下載進度" value={pack.completed} max={pack.total} />}
    {(pack.state === "failed" || pack.state === "unavailable") && <button className="btn ghost" type="button" onClick={() => setRetry(n => n + 1)}>重新檢查及下載</button>}
    {pack.state === "updating" && <button className="btn ghost" type="button" onClick={() => location.reload()}>重新開啟</button>}
  </section>;
}
