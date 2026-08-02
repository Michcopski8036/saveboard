import type { Board } from './boards';
import type { LinkData } from '../components/LinkCard';

/**
 * A snapshot of the last successful load, kept in localStorage so opening the
 * app paints the previous contents immediately instead of an empty screen.
 *
 * The backend is the slow part here — a cold database or an auth token refresh
 * can hold the first query for several seconds — and none of that has to be
 * visible. The snapshot is replaced as soon as the real data lands, so it is
 * only ever on screen while the network is in flight.
 */
const KEY = (userId: string) => `sb_snapshot_${userId}`;
const MAX_CHARS = 900_000;   // keep well under the ~5MB localStorage budget

interface Snapshot {
  links: LinkData[];
  boards: Board[];
  savedAt: number;
}

export function readSnapshot(userId: string): { links: LinkData[]; boards: Board[] } | null {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (!raw) return null;
    const snap = JSON.parse(raw) as Snapshot;
    if (!Array.isArray(snap.links) || !Array.isArray(snap.boards)) return null;
    // savedAt survives JSON as a string; the UI sorts and formats on a Date.
    const links = snap.links.map(l => ({ ...l, savedAt: new Date(l.savedAt) }));
    return { links, boards: snap.boards };
  } catch {
    return null;
  }
}

export function writeSnapshot(userId: string, links: LinkData[], boards: Board[]) {
  try {
    const payload = JSON.stringify({ links, boards, savedAt: Date.now() });
    if (payload.length > MAX_CHARS) return;   // silently skip oversized accounts
    localStorage.setItem(KEY(userId), payload);
  } catch {
    /* quota or private mode — the snapshot is an optimisation, never required */
  }
}

export function clearSnapshot(userId: string) {
  try { localStorage.removeItem(KEY(userId)); } catch { /* ignore */ }
}
