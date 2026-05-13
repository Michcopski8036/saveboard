import { useState, useEffect, useRef } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { LinkCard, LinkData } from './components/LinkCard';
import { Sidebar, type Collection } from './components/Sidebar';
import { KanbanView } from './components/KanbanView';
import { BottomNav } from './components/BottomNav';
import { ProfileMenu } from './components/ProfileMenu';
import { Auth } from './components/Auth';
import { Trash2, Paperclip, Search, Plus, LayoutGrid, List, Columns2, X, Menu, Bookmark, Kanban, Mic, MicOff, Link2, Sun, Moon } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

type ViewMode   = 'masonry' | 'grid' | 'list' | 'kanban';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

const defaultCategories = ['Articles', 'Videos', 'Design', 'Inspiration', 'Tools'];

const COLLECTION_LABELS: Record<string, string> = {
  all:           'Home',
  recent:        'Recently Saved',
  favorites:     'Favorites',
  unsorted:      'Unsorted',
  archive:       'Archive',
  'ai:suggested':'AI Suggested',
  'ai:reading':  'Reading List',
  'ai:trending': 'Trending Now',
  'ai:picks':    'Top Picks',
};

export default function App() {
  return <DndProvider backend={HTML5Backend}><ThemeProvider><AppContent /></ThemeProvider></DndProvider>;
}

function AppContent() {
  const { t, toggleTheme } = useTheme();
  const [user, setUser]                 = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [links, setLinks]               = useState<LinkData[]>([]);
  const [categories, setCategories]     = useState<string[]>(defaultCategories);
  const [isLoading, setIsLoading]       = useState(false);
  const [isAdding, setIsAdding]         = useState(false);
  const [urlInput, setUrlInput]         = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selected, setSelected]         = useState<Collection>('all');
  const [viewMode, setViewMode]         = useState<ViewMode>('masonry');
  const [sortOption, setSortOption]     = useState<SortOption>('newest');
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showFabMenu, setShowFabMenu]   = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const searchRef      = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setLinks([]); setCategories(defaultCategories); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: ld } = await supabase.from('links').select('*').order('created_at', { ascending: false });
      if (ld?.length) setLinks(ld.map(l => ({ ...l, savedAt: new Date(l.created_at) })));
      const { data: cd } = await supabase.from('categories').select('name').order('created_at', { ascending: true });
      if (cd?.length) setCategories(cd.map(c => c.name));
      else await supabase.from('categories').insert(defaultCategories.map(name => ({ name, user_id: user!.id })));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  let filtered = (() => {
    if (selected === 'all')           return links;
    if (selected === 'recent')        return links.filter(l => now - l.savedAt.getTime() < weekMs);
    if (selected === 'favorites')     return links.filter(l => favorites.has(l.id));
    if (selected === 'unsorted')      return links.filter(l => !l.category || l.category === 'None');
    if (selected === 'archive')       return links.filter(l => l.category === 'Archive');
    if (selected.startsWith('cat:'))  return links.filter(l => l.category === selected.slice(4));
    // AI Smart Folders (client-side heuristics)
    if (selected === 'ai:suggested')  return links.filter(l => l.description && l.description.length > 80).slice(0, 20);
    if (selected === 'ai:reading') {
      const articleDomains = ['medium', 'substack', 'blog', 'article', 'news', 'dev.to', 'hackernews', 'hn.'];
      return links.filter(l => { try { const h = new URL(l.url).hostname; return articleDomains.some(d => h.includes(d)); } catch { return false; } });
    }
    if (selected === 'ai:trending')   return [...links].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()).slice(0, 15);
    if (selected === 'ai:picks')      return links.filter(l => favorites.has(l.id) || (l.description && l.description.length > 60)).slice(0, 12);
    return links;
  })();

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q)
    );
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortOption === 'newest') return b.savedAt.getTime() - a.savedAt.getTime();
    if (sortOption === 'oldest') return a.savedAt.getTime() - b.savedAt.getTime();
    if (sortOption === 'a-z')    return a.title.localeCompare(b.title);
    return b.title.localeCompare(a.title);
  });

  const collectionLabel = selected.startsWith('cat:')
    ? selected.slice(4)
    : (COLLECTION_LABELS[selected] ?? 'Home');

  const weekLinks = links.filter(l => now - l.savedAt.getTime() < weekMs).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const closeModal = () => { setShowAddModal(false); setUrlInput(''); setErrorMessage(''); setSuccessMessage(''); };

  const handleAddUrl = async (onSuccess?: () => void) => {
    const input = urlInput.trim();
    if (!input || !user) return;
    setErrorMessage(''); setSuccessMessage(''); setIsAdding(true);
    try {
      const { fetchMetadata, generateId } = await import('./utils/metadataFetcher');
      const { parseEmbedCode } = await import('./utils/embedParser');

      const embedData = parseEmbedCode(input);
      if (embedData) {
        const nl = { id: generateId(), user_id: user.id, url: embedData.url, title: embedData.title || 'Embedded Content', description: embedData.description || '', image: embedData.image || 'placeholder:default', category: 'None', created_at: Date.now() };
        const { error } = await supabase.from('links').insert(nl);
        if (error) throw error;
        setLinks(p => [{ ...nl, savedAt: new Date(nl.created_at) }, ...p]);
        setUrlInput(''); setSuccessMessage('Added!'); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.(); return;
      }

      const looksLikeUrl = /^https?:\/\//i.test(input) || /^www\./i.test(input);
      let isValidUrl = false;
      if (looksLikeUrl) { try { new URL(input.startsWith('www.') ? 'https://' + input : input); isValidUrl = true; } catch { /**/ } }

      if (!isValidUrl) {
        const nl = { id: generateId(), user_id: user.id, url: '#', title: input.slice(0, 50), description: input, image: 'placeholder:memo', category: 'None', created_at: Date.now() };
        const { error } = await supabase.from('links').insert(nl);
        if (error) throw error;
        setLinks(p => [{ ...nl, savedAt: new Date(nl.created_at) }, ...p]);
        setUrlInput(''); setSuccessMessage('Note saved!'); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.(); return;
      }

      const url = input.startsWith('www.') ? 'https://' + input : input;
      if (links.some(l => l.url === url)) { setErrorMessage('Already saved'); return; }
      const meta = await fetchMetadata(url);
      const nl = { id: generateId(), user_id: user.id, url, title: meta.title || 'Web Page', description: meta.description || '', image: meta.image || 'placeholder:default', category: 'None', created_at: Date.now() };
      const { error } = await supabase.from('links').insert(nl);
      if (error) throw error;
      setLinks(p => [{ ...nl, savedAt: new Date(nl.created_at) }, ...p]);
      setUrlInput(''); setSuccessMessage('Link added!'); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.();
    } catch { setErrorMessage('Failed. Please try again.'); }
    finally { setIsAdding(false); }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== 'application/pdf') { setErrorMessage('Only PDF files supported'); return; }
    setErrorMessage(''); setSuccessMessage(''); setIsAdding(true);
    try {
      const { generateId } = await import('./utils/metadataFetcher');
      const id = generateId();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${id}-${safe}`;
      const { error: ue } = await supabase.storage.from('pdfs').upload(path, file, { contentType: 'application/pdf' });
      if (ue) throw ue;
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path);
      const nl = { id, user_id: user.id, url: publicUrl, title: file.name.replace(/\.pdf$/i, ''), description: `PDF • ${(file.size / 1024).toFixed(0)} KB`, image: 'placeholder:pdf', category: 'None', created_at: Date.now() };
      const { error } = await supabase.from('links').insert(nl);
      if (error) throw error;
      setLinks(p => [{ ...nl, savedAt: new Date(nl.created_at) }, ...p]);
      setSuccessMessage('PDF uploaded!'); setTimeout(() => setSuccessMessage(''), 2500); setShowAddModal(false);
    } catch (err: any) { setErrorMessage(err?.message?.toLowerCase().includes('bucket') ? 'Create a "pdfs" bucket in Supabase first' : 'PDF upload failed'); }
    finally { setIsAdding(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleUpdateCategory  = async (id: string, cat: string) => { await supabase.from('links').update({ category: cat }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, category: cat } : l)); };
  const handleDeleteLink      = async (id: string) => { await supabase.from('links').delete().eq('id', id); setLinks(p => p.filter(l => l.id !== id)); };
  const handleUpdateNotes     = async (id: string, notes: string) => { await supabase.from('links').update({ notes }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, notes } : l)); };
  const handleToggleFavorite  = (id: string) => { setFavorites(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const handleToggleSelect    = (id: string) => { setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const handleBulkDelete      = async () => { if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} link(s)?`)) return; await supabase.from('links').delete().in('id', Array.from(selectedIds)); setLinks(p => p.filter(l => !selectedIds.has(l.id))); setSelectedIds(new Set()); setSelectMode(false); };

  const handleAddCategory = async (name: string) => {
    const t = name.trim();
    if (t && !categories.includes(t)) { await supabase.from('categories').insert({ name: t, user_id: user!.id }); setCategories(p => [...p, t]); }
  };
  const handleRenameCategory = async (old: string, neu: string) => {
    const t = neu.trim();
    if (categories.includes(t)) { alert('Name already exists'); return; }
    await supabase.from('categories').update({ name: t }).eq('name', old).eq('user_id', user!.id);
    await supabase.from('links').update({ category: t }).eq('category', old).eq('user_id', user!.id);
    setCategories(p => p.map(c => c === old ? t : c));
    setLinks(p => p.map(l => l.category === old ? { ...l, category: t } : l));
    if (selected === `cat:${old}`) setSelected(`cat:${t}`);
  };
  const handleDeleteCategory = async (cat: string) => {
    const using = links.filter(l => l.category === cat);
    if (using.length && !confirm(`${using.length} link(s) will be uncategorized. Continue?`)) return;
    if (using.length) { await supabase.from('links').update({ category: 'None' }).eq('category', cat).eq('user_id', user!.id); setLinks(p => p.map(l => l.category === cat ? { ...l, category: 'None' } : l)); }
    await supabase.from('categories').delete().eq('name', cat).eq('user_id', user!.id);
    setCategories(p => p.filter(c => c !== cat));
    if (selected === `cat:${cat}`) setSelected('all');
  };
  const focusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchInputRef.current?.focus();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ links, categories, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `linkboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleImport = async (data: any) => {
    if (!data.links || !Array.isArray(data.links)) { alert('Invalid format'); return; }
    if (!confirm(`Import ${data.links.length} link(s)?`)) return;
    await supabase.from('links').delete().eq('user_id', user!.id);
    const il = data.links.map((l: any) => ({ ...l, user_id: user!.id, savedAt: undefined, created_at: new Date(l.savedAt).getTime() }));
    await supabase.from('links').insert(il);
    setLinks(il.map((l: any) => ({ ...l, savedAt: new Date(l.created_at) })));
    alert('Import successful!');
  };

  const cardProps = (link: LinkData) => ({
    link,
    onUpdateCategory: handleUpdateCategory, onDelete: handleDeleteLink,
    onAddCategory: handleAddCategory, onRenameCategory: handleRenameCategory,
    onUpdateNotes: handleUpdateNotes, onToggleSelect: handleToggleSelect,
    onToggleFavorite: handleToggleFavorite, categories,
    selectMode, isSelected: selectedIds.has(link.id), isFavorited: favorites.has(link.id),
  });

  const viewModes = [
    { mode: 'masonry' as ViewMode, Icon: Columns2,  label: 'Masonry' },
    { mode: 'grid'    as ViewMode, Icon: LayoutGrid, label: 'Grid'    },
    { mode: 'list'    as ViewMode, Icon: List,       label: 'List'    },
    { mode: 'kanban'  as ViewMode, Icon: Kanban,     label: 'Kanban'  },
  ];

  const sortLabels: Record<SortOption, string> = { newest: 'Newest', oldest: 'Oldest', 'a-z': 'A–Z', 'z-a': 'Z–A' };

  // ── Auth / loading states ──────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.pageBg }}>
      <svg className="animate-spin h-9 w-9" style={{ color: '#7C3AED' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  if (!user) return <Auth />;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: t.pageBg, color: t.pageText }}>

      {/* Sidebar */}
      <Sidebar
        categories={categories}
        selected={selected}
        onSelect={(id) => { setSelected(id); setSidebarOpen(false); }}
        links={links}
        favorites={favorites}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 xl:hidden" style={{ background: t.mobileOverlay }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className="flex-1 ml-0 md:ml-16 xl:ml-[260px] flex flex-col min-h-screen" style={{ background: t.pageBg }}>

        {/* Header */}
        <header className="sticky top-0 z-10" style={{ background: t.headerBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${t.headerBorder}` }}>
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-xl transition-colors"
              style={{ color: t.textMuted }}
              onClick={() => setSidebarOpen(p => !p)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="flex-1 relative" ref={searchRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: t.textMuted }} />
              <input
                ref={searchInputRef}
                type="text" value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchDrop(e.target.value.trim().length > 0); }}
                onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; if (searchQuery.trim()) setShowSearchDrop(true); }}
                onBlur={e => { e.currentTarget.style.borderColor = t.inputBlurBorder; e.currentTarget.style.boxShadow = 'none'; setTimeout(() => setShowSearchDrop(false), 150); }}
                placeholder="Search links, notes, boards…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}
              />
              {/* Instant search dropdown */}
              {showSearchDrop && searchQuery.trim() && (() => {
                const q = searchQuery.toLowerCase();
                const hits = links.filter(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)).slice(0, 6);
                if (!hits.length) return null;
                return (
                  <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl overflow-hidden z-50"
                    style={{ background: t.searchDropBg, border: `1px solid ${t.searchDropBorder}`, boxShadow: t.searchDropShadow }}>
                    <div className="p-1.5">
                      {hits.map(l => {
                        const dom = (() => { try { return new URL(l.url).hostname.replace('www.', ''); } catch { return 'Note'; } })();
                        return (
                          <a key={l.id} href={l.url === '#' ? undefined : l.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                            style={{ color: t.searchDropItemText }}
                            onMouseEnter={e => (e.currentTarget.style.background = t.searchDropItemHoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => setShowSearchDrop(false)}>
                            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                              style={{ background: t.searchDropIconBg }}>
                              {l.image && !l.image.startsWith('placeholder:')
                                ? <img src={l.image} alt="" className="w-full h-full object-cover" />
                                : <Link2 className="w-3.5 h-3.5" style={{ color: t.textMuted }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium truncate">{l.title}</p>
                              <p className="text-[10px] truncate" style={{ color: t.searchDropSecondary }}>{dom}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                    <div className="px-3 py-2" style={{ borderTop: `1px solid ${t.searchDropFooterBorder}` }}>
                      <p className="text-[10px]" style={{ color: t.searchDropFooterText }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} in main view</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* View mode */}
            <div className="hidden sm:flex items-center p-1 rounded-xl gap-0.5" style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}` }}>
              {viewModes.map(({ mode, Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={label}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: viewMode === mode ? t.controlActiveBg : 'transparent', color: viewMode === mode ? t.controlActiveColor : t.controlInactiveColor }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Select toggle */}
            <button onClick={() => { setSelectMode(p => !p); setSelectedIds(new Set()); }}
              className="hidden sm:block px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
              style={{ background: selectMode ? t.selectBtnActiveBg : t.selectBtnBg, color: selectMode ? t.selectBtnActiveText : t.selectBtnText, border: `1px solid ${selectMode ? t.selectBtnActiveBorder : t.selectBtnBorder}` }}>
              {selectMode ? 'Cancel' : 'Select'}
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme} title={t.isDark ? 'Switch to Light' : 'Switch to Dark'}
              className="p-2 rounded-xl transition-all"
              style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}`, color: t.textMuted }}
              onMouseEnter={e => { e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.30)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.controlContainerBorder; }}>
              {t.isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Add button */}
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: t.accentBg, boxShadow: t.accentShadow }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = t.accentShadowHover; e.currentTarget.style.opacity = '0.92'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = t.accentShadow; e.currentTarget.style.opacity = '1'; }}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:block">Add Link</span>
            </button>

            {/* Avatar */}
            <ProfileMenu onExport={handleExport} onImport={handleImport} onSignOut={async () => supabase.auth.signOut()} user={user} />
          </div>

          {/* Sub-header: title + sort */}
          <div className="px-4 sm:px-6 pb-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-bold" style={{ color: t.textPrimary }}>{collectionLabel}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium tabular-nums"
                style={{ background: t.badgeBg, color: t.badgeText }}>
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(['newest', 'oldest', 'a-z', 'z-a'] as SortOption[]).map(opt => (
                <button key={opt} onClick={() => setSortOption(opt)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: sortOption === opt ? t.sortActiveBg : 'transparent', color: sortOption === opt ? t.sortActiveText : t.sortInactiveText }}>
                  {sortLabels[opt]}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────────────── */}
        <main className="flex-1 px-4 sm:px-6 py-5 pb-24 md:pb-5">
          {isLoading ? (
            <div className="flex justify-center pt-24">
              <svg className="animate-spin h-8 w-8" style={{ color: '#7C3AED' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-28 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: t.emptyIconContainerBg, border: `1px solid ${t.emptyIconContainerBorder}` }}>
                <Bookmark className="w-7 h-7" style={{ color: t.emptyIconColor }} />
              </div>
              <p className="text-[15px] font-semibold" style={{ color: t.emptyTitle }}>Nothing here yet</p>
              <p className="text-[13px] mt-1.5" style={{ color: t.emptySub }}>Add your first link with the button above</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanView
              links={filtered}
              categories={categories}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteLink}
              onUpdateCategory={handleUpdateCategory}
            />
          ) : viewMode === 'masonry' ? (
            <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 360: 2, 768: 3, 1280: 4, 1600: 5 }}>
              <Masonry gutter="14px">
                {filtered.map(link => <LinkCard key={link.id} {...cardProps(link)} />)}
              </Masonry>
            </ResponsiveMasonry>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filtered.map(link => <LinkCard key={link.id} {...cardProps(link)} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl mx-auto">
              {filtered.map(link => <LinkCard key={link.id} {...cardProps(link)} listMode />)}
            </div>
          )}
        </main>
      </div>

      {/* ── Add Link modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-50 backdrop-blur-[4px]" style={{ background: t.modalBackdrop }} onClick={closeModal} />
          <div className="fixed z-50 w-[480px] max-w-[92vw] p-6 rounded-2xl"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: t.modalTitle }}>Add to LinkBoard</h3>
                <p className="text-[12px] mt-0.5" style={{ color: t.modalSubtitle }}>Paste a URL, embed code, or write a note</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-xl transition-colors mt-0.5"
                style={{ color: t.modalCloseText }}
                onMouseEnter={e => (e.currentTarget.style.background = t.modalCloseBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.textMuted }} />
              <input
                type="text" value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isAdding && urlInput.trim()) handleAddUrl(closeModal); }}
                placeholder="https://… or write a note"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}
                onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
                onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {errorMessage && <p className="text-[12px] text-red-500/90 mb-3 px-1">{errorMessage}</p>}
            {successMessage && <p className="text-[12px] text-green-600/90 mb-3 px-1">{successMessage}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={isAdding}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50"
                style={{ background: t.modalPdfBg, border: `1px solid ${t.modalPdfBorder}`, color: t.modalPdfText }}>
                <Paperclip className="w-3.5 h-3.5" />
                PDF
              </button>
              <button onClick={() => handleAddUrl(closeModal)} disabled={isAdding || !urlInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: t.accentBg }}>
                {isAdding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding…
                  </span>
                ) : 'Add'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hidden PDF input */}
      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfUpload} />

      {/* ── Floating Action Button (tablet+) ──────────────────────────── */}
      {!selectMode && (
        <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-2.5">
          {/* FAB sub-actions */}
          {showFabMenu && (
            <>
              {/* Voice input */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ background: t.fabSubLabelBg, color: t.fabSubLabelText, backdropFilter: 'blur(8px)', border: `1px solid ${t.fabSubLabelBorder}`, boxShadow: t.fabSubLabelShadow }}>
                  {isRecording ? 'Recording…' : 'Voice Input'}
                </span>
                <button
                  onClick={() => setIsRecording(p => !p)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: isRecording ? '#EF4444' : t.fabSubBtnBg,
                    border: isRecording ? '2px solid rgba(239,68,68,0.5)' : `1px solid ${t.fabSubBtnBorder}`,
                    boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.40), 0 4px 16px rgba(239,68,68,0.25)' : t.fabSubBtnShadow,
                  }}>
                  {isRecording
                    ? <MicOff className="w-5 h-5 text-white" />
                    : <Mic className="w-5 h-5" style={{ color: t.fabSubBtnIcon }} />}
                </button>
              </div>
              {/* Add link */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ background: t.fabSubLabelBg, color: t.fabSubLabelText, backdropFilter: 'blur(8px)', border: `1px solid ${t.fabSubLabelBorder}`, boxShadow: t.fabSubLabelShadow }}>
                  Add Link
                </span>
                <button
                  onClick={() => { setShowAddModal(true); setShowFabMenu(false); }}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{ background: t.fabSubBtnBg, border: `1px solid ${t.fabSubBtnBorder}`, boxShadow: t.fabSubBtnShadow }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.fabSubBtnHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = t.fabSubBtnBg)}>
                  <Link2 className="w-5 h-5" style={{ color: t.fabSubBtnIcon }} />
                </button>
              </div>
            </>
          )}

          {/* Main FAB */}
          <button
            onClick={() => { setShowFabMenu(p => !p); if (isRecording) setIsRecording(false); }}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
            style={{
              background: showFabMenu ? t.accentBgActive : t.accentBg,
              boxShadow: t.accentShadow,
              transform: showFabMenu ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = t.accentShadowHover)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = t.accentShadow)}>
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── Bulk delete bar ────────────────────────────────────────────── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[88px] md:bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl"
            style={{ background: t.floatingBg, backdropFilter: 'blur(16px)', border: `1px solid ${t.floatingBorder}`, boxShadow: t.floatingShadow }}>
            <span className="text-[13px] font-medium" style={{ color: t.floatingText }}>{selectedIds.size} selected</span>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: t.accentBg }}>
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom nav (mobile only) ───────────────────────────────────── */}
      <BottomNav
        selected={selected}
        onSelect={(id) => { setSelected(id); setSidebarOpen(false); }}
        onOpenAdd={() => setShowAddModal(true)}
        onFocusSearch={focusSearch}
        onOpenMore={() => setSidebarOpen(true)}
        favorites={favorites}
      />
    </div>
  );
}
