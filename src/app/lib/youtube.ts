// Loads the YouTube IFrame Player API once, shared across all players.
//
// WHY we need this at all: in the iOS WKWebView, a plain `<iframe src=".../embed/…">`
// is rejected by YouTube with "Error 153 / Video player configuration error" (the
// non-standard capacitor:// origin + WebView context fails YouTube's embed checks).
// The IFrame Player API loads the same video and plays fine in the exact same
// WebView — proven on-device 2026-07-27. So all in-app YouTube playback goes
// through the API, never a bare iframe. (Web is unaffected, but shares this path.)

export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

let apiPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const w = window as any;
    if (w.YT && w.YT.Player) { resolve(); return; }
    // Chain onto any existing callback so we don't clobber another loader.
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch { /* ignore */ } resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}
