import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2, Trash2, Copy, Unlink, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { LinkData } from './LinkCard';

// ── URL canonicalisation for duplicate detection ─────────────────────────────
// Same board + same canonical URL = duplicate. Cross-board copies are the
// multi-board add feature working as intended, so they are NOT duplicates.
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|igshid$|si$)/i;
function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    const params = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAM.test(k));
    params.sort(([a], [b]) => a.localeCompare(b));
    const q = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
    return u.hostname.toLowerCase().replace(/^www\./, '') + u.pathname.replace(/\/+$/, '') + q;
  } catch { return null; }
}

// ── Reachability probe (client-side only, no server storage) ─────────────────
// cors HEAD gives a real status when the site allows it; a cors failure is
// retried no-cors, where success only proves the host is alive ('unknown').
// Only a network-level failure on both counts as broken.
type Reach = 'ok' | 'broken' | 'unknown';
async function checkUrl(url: string): Promise<Reach> {
  const probe = async (mode: RequestMode) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try { return await fetch(url, { method: 'HEAD', mode, redirect: 'follow', signal: ctl.signal }); }
    finally { clearTimeout(timer); }
  };
  try {
    const res = await probe('cors');
    if (res.type === 'opaque') return 'unknown';
    if (res.status === 404 || res.status === 410) return 'broken';
    return 'ok';
  } catch (e: any) {
    if (e?.name === 'AbortError') return 'unknown';   // slow ≠ dead
    try { await probe('no-cors'); return 'unknown'; } // alive but CORS-blocked
    catch { return 'broken'; }                        // DNS/connection dead
  }
}

interface CleanupModalProps {
  links: LinkData[];             // editable links only — caller excludes view-only boards
  onClose: () => void;
  onDeleteLinks: (ids: string[]) => Promise<void> | void;
}

export function CleanupModal({ links, onClose, onDeleteLinks }: CleanupModalProps) {
  const { t } = useTheme();
  const { language } = useLanguage();
  const ko = language === 'ko';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [reach, setReach] = useState<Record<string, Reach>>({});
  const [scanned, setScanned] = useState(0);
  const scanRun = useRef(false);

  const byId = useMemo(() => new Map(links.map(l => [l.id, l] as const)), [links]);

  // Duplicates: group by board + canonical URL, keep the oldest copy.
  const dupGroups = useMemo(() => {
    const groups = new Map<string, LinkData[]>();
    links.forEach(l => {
      const norm = normalizeUrl(l.url);
      if (!norm) return; // memos/uploads placeholders
      const key = `${l.boardId ?? 'unsorted'}|${norm}`;
      groups.set(key, [...(groups.get(key) ?? []), l]);
    });
    return [...groups.values()]
      .filter(g => g.length > 1)
      .map(g => [...g].sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime()));
  }, [links]);

  // Broken-link scan: small worker pool, runs once per open.
  const candidates = useMemo(() => links.filter(l => normalizeUrl(l.url)), [links]);
  useEffect(() => {
    if (scanRun.current) return;
    scanRun.current = true;
    let cancelled = false;
    const queue = [...candidates];
    const worker = async () => {
      for (;;) {
        const l = queue.shift();
        if (!l || cancelled) return;
        const r = await checkUrl(l.url);
        if (cancelled) return;
        setReach(p => ({ ...p, [l.id]: r }));
        setScanned(n => n + 1);
      }
    };
    Promise.all(Array.from({ length: 6 }, worker));
    return () => { cancelled = true; };
  }, [candidates]);

  const brokenLinks = candidates.filter(l => reach[l.id] === 'broken');
  const scanDone = scanned >= candidates.length;

  const toggle = (id: string) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectDupes = () => setSelected(p => { const s = new Set(p); dupGroups.forEach(g => g.slice(1).forEach(l => s.add(l.id))); return s; });
  const selectBroken = () => setSelected(p => { const s = new Set(p); brokenLinks.forEach(l => s.add(l.id)); return s; });

  const handleDelete = async () => {
    if (!selected.size || !confirm(ko ? `링크 ${selected.size}개를 삭제할까요?` : `Delete ${selected.size} link(s)?`)) return;
    setDeleting(true);
    await onDeleteLinks(Array.from(selected).filter(id => byId.has(id)));
    setSelected(new Set());
    setDeleting(false);
  };

  const Row = ({ l, note }: { l: LinkData; note?: string }) => (
    <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer" style={{ background: t.inputBg }}>
      <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} className="accent-purple-600 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] truncate" style={{ color: t.textPrimary }}>{l.title || l.url}</span>
        <span className="block text-[11px] truncate" style={{ color: t.textMuted }}>{l.category !== 'None' ? `${l.category} · ` : ''}{l.url}</span>
      </span>
      {note && <span className="text-[10px] font-semibold shrink-0" style={{ color: '#F59E0B' }}>{note}</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h2 className="text-[16px] font-bold" style={{ color: t.textPrimary }}>{ko ? '링크 정리' : 'Clean up links'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: t.textMuted }}><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pb-4 overflow-y-auto space-y-5">
          {/* Duplicates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: t.textSecondary }}>
                <Copy className="w-3.5 h-3.5" />{ko ? `중복 ${dupGroups.length}묶음` : `${dupGroups.length} duplicate group${dupGroups.length !== 1 ? 's' : ''}`}
              </p>
              {dupGroups.length > 0 && (
                <button onClick={selectDupes} className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>
                  {ko ? '오래된 것만 남기고 선택' : 'Select all but oldest'}
                </button>
              )}
            </div>
            {dupGroups.length === 0 ? (
              <p className="flex items-center gap-1.5 text-[12px]" style={{ color: t.textMuted }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{ko ? '같은 보드 안에 중복된 링크가 없어요' : 'No duplicates within any board'}
              </p>
            ) : (
              <div className="space-y-2">
                {dupGroups.map((g, i) => (
                  <div key={i} className="space-y-1">
                    {g.map((l, j) => <Row key={l.id} l={l} note={j === 0 ? (ko ? '원본(오래됨)' : 'oldest') : undefined} />)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Broken links */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: t.textSecondary }}>
                <Unlink className="w-3.5 h-3.5" />
                {scanDone
                  ? (ko ? `깨진 링크 ${brokenLinks.length}개` : `${brokenLinks.length} broken link${brokenLinks.length !== 1 ? 's' : ''}`)
                  : (ko ? `링크 확인 중… ${scanned}/${candidates.length}` : `Checking links… ${scanned}/${candidates.length}`)}
                {!scanDone && <Loader2 className="w-3 h-3 animate-spin" />}
              </p>
              {brokenLinks.length > 0 && (
                <button onClick={selectBroken} className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>
                  {ko ? '모두 선택' : 'Select all'}
                </button>
              )}
            </div>
            {scanDone && brokenLinks.length === 0 ? (
              <p className="flex items-center gap-1.5 text-[12px]" style={{ color: t.textMuted }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{ko ? '깨진 링크가 없어요' : 'No broken links found'}
              </p>
            ) : (
              <div className="space-y-1">
                {brokenLinks.map(l => <Row key={l.id} l={l} />)}
              </div>
            )}
            {scanDone && (
              <p className="mt-1.5 text-[10px]" style={{ color: t.textFaint }}>
                {ko ? '봇을 차단하는 사이트는 확인할 수 없어 목록에서 제외돼요.' : 'Sites that block automated checks can’t be verified and are left out.'}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
          <button onClick={handleDelete} disabled={!selected.size || deleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: '#EF4444' }}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {ko ? `선택한 ${selected.size}개 삭제` : `Delete ${selected.size} selected`}
          </button>
        </div>
      </div>
    </div>
  );
}
