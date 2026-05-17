const PRO_STATUS_KEY = "checkers-arena:pro-active";
const PRO_EVENT = "checkers-arena:pro-updated";

export function activatePro(): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PRO_STATUS_KEY, "true");
  window.dispatchEvent(new Event(PRO_EVENT));
}

export function isProActive(): boolean {
  return isBrowser() && window.localStorage.getItem(PRO_STATUS_KEY) === "true";
}

export function subscribeToProStatus(listener: () => void): () => void {
  if (!isBrowser()) return () => undefined;
  window.addEventListener(PRO_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(PRO_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}
