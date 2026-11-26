export const isTrial = new URLSearchParams(location.search).get("trial") === "1";

export function installCourseWorker() {
  const base = import.meta.env.BASE_URL || "/";
  return navigator.serviceWorker.register(`${base}sw.js`, { scope: base, updateViaCache: "none" });
}
