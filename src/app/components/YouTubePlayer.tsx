import { useEffect, useRef } from 'react';
import { loadYouTubeAPI } from '../lib/youtube';

// Plays a YouTube video via the IFrame Player API (not a bare <iframe>), which is
// the only method that works inside the iOS WKWebView — see lib/youtube.ts.
export function YouTubePlayer({
  videoId, muted = true, autoplay = true, loop = true, controls = false, className,
}: {
  videoId: string;
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Create the player once per videoId.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !hostRef.current) return;
      const YT = (window as any).YT;
      playerRef.current = new YT.Player(hostRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: muted ? 1 : 0,
          controls: controls ? 1 : 0,
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined,   // loop needs the id repeated
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
      });
    });
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId]);

  // Toggle mute in place without recreating the player.
  useEffect(() => {
    const p = playerRef.current;
    if (p?.mute) { muted ? p.mute() : p.unMute(); }
  }, [muted]);

  // YT.Player replaces the inner div with its iframe; the wrapper carries layout.
  return <div className={className}><div ref={hostRef} style={{ width: '100%', height: '100%' }} /></div>;
}
