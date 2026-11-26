import { useEffect, useState } from "react";
import { addDays, macauDate } from "./daily.mjs";

export function useMacauDate() {
  const [date, setDate] = useState(() => macauDate());
  useEffect(() => {
    let timer: number;
    function refresh() {
      window.clearTimeout(timer);
      const now = new Date();
      const today = macauDate(now);
      setDate(today);
      const midnight = Date.parse(addDays(today, 1) + "T00:00:00+08:00");
      timer = window.setTimeout(refresh, midnight - now.getTime());
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return date;
}
