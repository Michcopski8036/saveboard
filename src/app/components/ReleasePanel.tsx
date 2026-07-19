import { useState, useEffect, useCallback } from 'react';
import { Apple, Smartphone, Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ConfigRow {
  platform: 'ios' | 'android';
  latest_version: string;
  min_version: string;
  store_url: string;
  updated_at: string;
}

const META = {
  ios:     { icon: Apple,      label: 'iOS · App Store',   color: '#111827' },
  android: { icon: Smartphone, label: 'Android · Play',    color: '#3DDC84' },
} as const;

/**
 * Live editor for the `app_config` update gate — replaces hand-writing SQL in the
 * Supabase editor after every store release. Bumping latest_version shows the soft
 * banner to everyone behind it; min_version forces the update (critical releases only).
 */
export function ReleasePanel({ accessToken }: { accessToken: string | null }) {
  const { t } = useTheme();
  const [rows, setRows]       = useState<ConfigRow[] | null>(null);
  const [draft, setDraft]     = useState<Record<string, Partial<ConfigRow>>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved, setSaved]     = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const res = await fetch('/api/admin-stats?resource=app-config', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { config } = await res.json();
      setRows(config);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load release config');
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const valueOf = (row: ConfigRow, field: keyof ConfigRow) =>
    (draft[row.platform]?.[field] as string) ?? (row[field] as string);

  const dirty = (row: ConfigRow) =>
    (['latest_version', 'min_version', 'store_url'] as const).some(f => valueOf(row, f) !== row[f]);

  const save = async (row: ConfigRow) => {
    setSaving(row.platform); setError(null); setSaved(null);
    try {
      const res = await fetch('/api/admin-stats?resource=app-config', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: row.platform,
          latest_version: valueOf(row, 'latest_version'),
          min_version: valueOf(row, 'min_version'),
          store_url: valueOf(row, 'store_url'),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Save failed'); }
      setDraft(d => { const n = { ...d }; delete n[row.platform]; return n; });
      setSaved(row.platform);
      setTimeout(() => setSaved(null), 2500);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const field = (row: ConfigRow, f: 'latest_version' | 'min_version' | 'store_url', label: string, hint: string) => (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textFaint }}>{label}</span>
      <input
        value={valueOf(row, f)}
        onChange={e => setDraft(d => ({ ...d, [row.platform]: { ...d[row.platform], [f]: e.target.value } }))}
        className="w-full mt-1 px-3 py-2 rounded-xl text-[13px] font-mono outline-none"
        style={{ background: t.pageBg, border: `1px solid ${t.cardBorder}`, color: t.textPrimary }}
      />
      <span className="text-[10px] block mt-1" style={{ color: t.textFaint }}>{hint}</span>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl px-4 py-3 text-[12px] leading-relaxed"
        style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', color: t.textMuted }}>
        <strong style={{ color: t.textPrimary }}>Update gate.</strong>{' '}
        Bump <span className="font-mono">latest_version</span> after each store release — everyone on an older
        build sees a dismissible “update available” banner. Only raise{' '}
        <span className="font-mono">min_version</span> for critical releases; it hard-blocks the app until they update.
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </div>
      )}

      {!rows && <div className="h-40 rounded-2xl animate-pulse" style={{ background: t.cardBg }} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows?.map(row => {
          const { icon: Icon, label, color } = META[row.platform];
          const isDirty = dirty(row);
          return (
            <div key={row.platform} className="rounded-2xl p-5 space-y-3"
              style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>{label}</p>
                {saved === row.platform && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold ml-auto" style={{ color: '#10B981' }}>
                    <CheckCircle className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>

              {field(row, 'latest_version', 'Latest version', 'Soft banner shows below this')}
              {field(row, 'min_version',    'Minimum version', 'Blocking screen below this — use sparingly')}
              {field(row, 'store_url',      'Store URL',       'Where the Update button sends users')}

              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => save(row)} disabled={!isDirty || saving === row.platform}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                  {saving === row.platform ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
                <span className="text-[10px]" style={{ color: t.textFaint }}>
                  Updated {new Date(row.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
