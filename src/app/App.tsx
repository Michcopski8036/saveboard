import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { LinkCard, LinkData } from './components/LinkCard';
import { Sidebar, type Collection } from './components/Sidebar';
import { KanbanView } from './components/KanbanView';
import { GalleryView } from './components/GalleryView';
import { BottomNav } from './components/BottomNav';
import { ProfileMenu } from './components/ProfileMenu';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { Trash2, Paperclip, Search, Plus, LayoutGrid, List, Columns2, X, Menu, Bookmark, Kanban, Mic, MicOff, Link2, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, MoreVertical, Pencil, Share2 } from 'lucide-react';

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="8" rx="2" />
      <rect x="3" y="13" width="7" height="8" rx="2" />
      <rect x="12" y="3" width="9" height="18" rx="2" />
    </svg>
  );
}
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ShareModal } from './components/ShareModal';
import { UpgradePage, FREE_LIMITS } from './components/UpgradePage';
import { SettingsPage } from './components/SettingsPage';
import { LanguagePage } from './components/LanguagePage';
import { ContactPage } from './components/ContactPage';
import { HelpPage } from './components/HelpPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { deriveAiTags } from './components/LinkCard';

type ViewMode   = 'masonry' | 'grid' | 'gallery' | 'list' | 'kanban';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'custom';

const defaultCategories = ['Events', 'Recipes', 'Fitness'];

// Labels computed dynamically via tr() in AppContent

export default function App() {
  return <DndProvider backend={HTML5Backend}><ThemeProvider><LanguageProvider><AppContent /></LanguageProvider></ThemeProvider></DndProvider>;
}

function AppContent() {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const [user, setUser]                 = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [showAuth, setShowAuth]         = useState(false);
  const [links, setLinks]               = useState<LinkData[]>([]);
  const [categories, setCategories]     = useState<string[]>([]);
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
  const [shareCategory, setShareCategory] = useState<string | null>(null);
  const [showFabMenu, setShowFabMenu]   = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [headerUrl, setHeaderUrl]       = useState('');
  const [headerStatus, setHeaderStatus] = useState<'idle'|'loading'|'saved'|'error'>('idle');
  const [showSearch, setShowSearch]     = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [deleteBoardConfirm, setDeleteBoardConfirm] = useState<{ cat: string; count: number } | null>(null);
  const [showMobileBoardMenu, setShowMobileBoardMenu] = useState(false);
  const [mobileBoardMenuRect, setMobileBoardMenuRect] = useState<DOMRect | null>(null);
  const [showMobileSortMenu, setShowMobileSortMenu] = useState(false);
  const [showHelp, setShowHelp]         = useState(false);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showTerms, setShowTerms]       = useState(false);
  const isPro = false; // Will be set from Stripe subscription status
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const searchRef       = useRef<HTMLDivElement>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);
  const headerInputRef  = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setLinks([]); setCategories([]); return; }
    loadData().then(() => handlePendingImport());
  }, [user]);

  const handlePendingImport = async () => {
    const token = localStorage.getItem('saveboard-pending-import');
    if (!token || !user) return;
    localStorage.removeItem('saveboard-pending-import');
    try {
      const { data } = await supabase
        .from('shared_boards')
        .select('category, links_snapshot')
        .eq('token', token)
        .single();
      if (!data) return;

      const catName = data.category;
      const { data: existingCat } = await supabase
        .from('categories').select('name').eq('name', catName).eq('user_id', user.id).single();
      if (!existingCat) {
        await supabase.from('categories').insert({ name: catName, user_id: user.id });
        setCategories(p => [...p, catName]);
      }

      const existingUrls = new Set(links.map(l => l.url));
      const newLinks = data.links_snapshot
        .filter((l: any) => !existingUrls.has(l.url))
        .map((l: any) => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          url: l.url,
          title: l.title,
          description: l.description || '',
          image: l.image || '',
          category: catName,
          created_at: Date.now(),
        }));
      if (newLinks.length > 0) {
        await supabase.from('links').insert(newLinks);
        setLinks(p => [...newLinks.map((l: any) => ({ ...l, savedAt: new Date(l.created_at) })), ...p]);
      }
      const skipped = data.links_snapshot.length - newLinks.length;
      alert(`"${catName}" board saved!${skipped > 0 ? ` (${skipped} duplicate${skipped > 1 ? 's' : ''} skipped)` : ''}`);
    } catch (e) { console.error(e); }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: ld } = await supabase.from('links').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (ld?.length) {
        let mapped = ld.map(l => ({ ...l, savedAt: new Date(l.created_at) }));
        try {
          const stored = localStorage.getItem(`sb_order_${user!.id}`);
          if (stored) {
            const order: string[] = JSON.parse(stored);
            const orderMap = new Map(order.map((id, i) => [id, i]));
            mapped = mapped.sort((a, b) => (orderMap.get(a.id) ?? 999999) - (orderMap.get(b.id) ?? 999999));
            setSortOption('custom');
          }
        } catch {}
        setLinks(mapped);
        setFavorites(new Set(ld.filter(l => l.is_favorite).map((l: any) => l.id)));
      }
      const { data: cd } = await supabase.from('categories').select('name').eq('user_id', user!.id).order('created_at', { ascending: true });
      if (cd?.length) setCategories(cd.map(c => c.name));
      else await supabase.from('categories').insert(defaultCategories.map(name => ({ name, user_id: user!.id })));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  let filtered = (() => {
    if (selected === 'all')            return links;
    if (selected === 'browse')        return links;
    if (selected === 'recent')        return links.filter(l => now - l.savedAt.getTime() < weekMs);
    if (selected === 'favorites')     return links.filter(l => favorites.has(l.id));
    if (selected === 'unsorted')      return links.filter(l => !l.category || l.category === 'None');
    if (selected.startsWith('cat:'))  return links.filter(l => l.category === selected.slice(4));
    if (selected.startsWith('tag:')) {
      const tag = selected.slice(4).toLowerCase();
      return links.filter(l => {
        if ((l.tags ?? []).includes(tag)) return true;
        const domain = (() => { try { return new URL(l.url).hostname.toLowerCase().replace('www.', ''); } catch { return ''; } })();
        return deriveAiTags(l, domain).some(t => t.type !== 'category' && t.label.toLowerCase() === tag);
      });
    }
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
    if (sortOption === 'custom') return 0;
    if (sortOption === 'newest') return b.savedAt.getTime() - a.savedAt.getTime();
    if (sortOption === 'oldest') return a.savedAt.getTime() - b.savedAt.getTime();
    if (sortOption === 'a-z')    return a.title.localeCompare(b.title);
    return b.title.localeCompare(a.title);
  });

  const COLLECTION_LABELS: Record<string, string> = {
    all:       tr('allLinks'),
    browse:    tr('allLinks'),
    recent:    tr('recentlySavedLabel'),
    favorites: tr('favoritesLabel'),
    unsorted:  tr('unsortedLabel'),
  };

  const collectionLabel = selected.startsWith('cat:')
    ? selected.slice(4)
    : selected.startsWith('tag:')
    ? `#${selected.slice(4)}`
    : (COLLECTION_LABELS[selected] ?? tr('home'));

  const weekLinks = links.filter(l => now - l.savedAt.getTime() < weekMs).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const closeModal = () => { setShowAddModal(false); setUrlInput(''); setErrorMessage(''); setSuccessMessage(''); };

  const handleHeaderSave = async () => {
    const val = headerUrl.trim();
    if (!val) return;
    setHeaderStatus('loading');
    try {
      await handleAddUrl(val);
      setHeaderUrl(''); setHeaderStatus('saved');
      setTimeout(() => setHeaderStatus('idle'), 2000);
    } catch { setHeaderStatus('error'); setTimeout(() => setHeaderStatus('idle'), 2000); }
  };

  const handleAddUrl = async (urlOverride?: string, onSuccess?: () => void) => {
    const input = (urlOverride ?? urlInput).trim();
    if (!input || !user) return;
    if (!isPro && links.length >= FREE_LIMITS.links) { setShowUpgrade(true); return; }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setErrorMessage(''); setSuccessMessage(''); setIsAdding(true);
    try {
      const { generateId } = await import('./utils/metadataFetcher');
      const id = generateId();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${id}-${safe}`;
      const { error: ue } = await supabase.storage.from('pdfs').upload(path, file, { contentType: file.type });
      if (ue) throw ue;
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path);
      const isImage = file.type.startsWith('image/');
      const isPdf   = file.type === 'application/pdf';
      const ext     = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
      const nl = { id, user_id: user.id, url: publicUrl, title: file.name.replace(/\.[^.]+$/, ''), description: `${ext} • ${(file.size / 1024).toFixed(0)} KB`, image: isImage ? publicUrl : isPdf ? 'placeholder:pdf' : 'placeholder:file', category: 'None', created_at: Date.now() };
      const { error } = await supabase.from('links').insert(nl);
      if (error) throw error;
      setLinks(p => [{ ...nl, savedAt: new Date(nl.created_at) }, ...p]);
      setSuccessMessage('File uploaded!'); setTimeout(() => setSuccessMessage(''), 2500); setShowAddModal(false);
    } catch (err: any) { setErrorMessage(err?.message?.toLowerCase().includes('bucket') ? 'Storage bucket not set up — check Supabase' : 'Upload failed'); }
    finally { setIsAdding(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleUpdateCategory  = async (id: string, cat: string) => { await supabase.from('links').update({ category: cat }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, category: cat } : l)); };
  const handleDeleteLink      = async (id: string) => { await supabase.from('links').delete().eq('id', id); setLinks(p => p.filter(l => l.id !== id)); };
  const handleUpdateNotes     = async (id: string, notes: string) => { await supabase.from('links').update({ notes }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, notes } : l)); };
  const handleUpdateLink      = async (id: string, title: string, description: string) => { await supabase.from('links').update({ title, description }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, title, description } : l)); };
  const handleUpdateTags      = async (id: string, tags: string[]) => { await supabase.from('links').update({ tags }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, tags } : l)); };
  const handleToggleFavorite  = async (id: string) => {
    const isFav = favorites.has(id);
    setFavorites(p => { const s = new Set(p); isFav ? s.delete(id) : s.add(id); return s; });
    await supabase.from('links').update({ is_favorite: !isFav }).eq('id', id);
  };
  const handleToggleSelect    = (id: string) => { setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const handleBulkDelete      = async () => { if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} link(s)?`)) return; await supabase.from('links').delete().in('id', Array.from(selectedIds)); setLinks(p => p.filter(l => !selectedIds.has(l.id))); setSelectedIds(new Set()); setSelectMode(false); };

  const handleAddCategory = async (name: string) => {
    const t = name.trim();
    if (!t || categories.includes(t)) return;
    if (!isPro && categories.length >= FREE_LIMITS.boards) { setShowUpgrade(true); return; }
    await supabase.from('categories').insert({ name: t, user_id: user!.id }); setCategories(p => [...p, t]);
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
  const handleDeleteCategory = (cat: string) => {
    const count = links.filter(l => l.category === cat).length;
    if (count > 0) { setDeleteBoardConfirm({ cat, count }); return; }
    execDeleteCategory(cat, false);
  };

  const execDeleteCategory = async (cat: string, deleteSaves: boolean) => {
    setDeleteBoardConfirm(null);
    if (deleteSaves) {
      await supabase.from('links').delete().eq('category', cat).eq('user_id', user!.id);
      setLinks(p => p.filter(l => l.category !== cat));
    } else {
      await supabase.from('links').update({ category: 'None' }).eq('category', cat).eq('user_id', user!.id);
      setLinks(p => p.map(l => l.category === cat ? { ...l, category: 'None' } : l));
    }
    await supabase.from('categories').delete().eq('name', cat).eq('user_id', user!.id);
    setCategories(p => p.filter(c => c !== cat));
    if (selected === `cat:${cat}`) setSelected('all');
  };
  const focusSearch = () => { setShowSearch(true); setTimeout(() => searchOverlayRef.current?.focus(), 50); };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ links, categories, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `saveboard-${new Date().toISOString().split('T')[0]}.json`;
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

  // Build suggested tags list from all links (auto-derived + user-added)
  const suggestedTags = (() => {
    const map: Record<string, string> = {};
    links.forEach(l => {
      const domain = (() => { try { return new URL(l.url).hostname.toLowerCase().replace('www.', ''); } catch { return ''; } })();
      deriveAiTags(l, domain).filter(t => t.type !== 'category').forEach(({ label, type }) => {
        const key = label.toLowerCase();
        if (!map[key]) map[key] = type;
      });
      (l.tags ?? []).forEach(tag => { if (!map[tag]) map[tag] = 'user'; });
    });
    return Object.entries(map).map(([label, type]) => ({ label, type })).sort((a, b) => a.label.localeCompare(b.label));
  })();

  const cardProps = (link: LinkData) => ({
    link,
    onUpdateCategory: handleUpdateCategory, onDelete: handleDeleteLink,
    onAddCategory: handleAddCategory, onRenameCategory: handleRenameCategory,
    onUpdateNotes: handleUpdateNotes, onUpdateLink: handleUpdateLink, onUpdateTags: handleUpdateTags, onToggleSelect: handleToggleSelect,
    onToggleFavorite: handleToggleFavorite, onShowUpgrade: () => setShowUpgrade(true), onMoveCard: moveCard,
    categories, isPro, suggestedTags,
    selectMode, isSelected: selectedIds.has(link.id), isFavorited: favorites.has(link.id),
  });

  const viewModes = [
    { mode: 'masonry' as ViewMode, Icon: Columns2,        label: 'Masonry' },
    { mode: 'gallery' as ViewMode, Icon: GalleryIcon,     label: 'Gallery' },
    { mode: 'kanban'  as ViewMode, Icon: Kanban,          label: 'Kanban'  },
  ];

  const sortLabels: Record<SortOption, string> = { newest: tr('newest'), oldest: tr('oldest'), 'a-z': tr('az'), 'z-a': tr('za'), custom: 'Custom' };

  const moveCard = (dragId: string, hoverId: string) => {
    if (dragId === hoverId) return;
    setSortOption('custom');
    setLinks(prev => {
      const arr = [...prev];
      const from = arr.findIndex(l => l.id === dragId);
      const to   = arr.findIndex(l => l.id === hoverId);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      if (user) localStorage.setItem(`sb_order_${user.id}`, JSON.stringify(arr.map(l => l.id)));
      return arr;
    });
  };

  // ── Auth / loading states ──────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.pageBg }}>
      <svg className="animate-spin h-9 w-9" style={{ color: '#7C3AED' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  if (!user) {
    if (showAuth) return <Auth />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

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
        onShareCategory={cat => setShareCategory(cat)}
        onUpdateCategory={handleUpdateCategory}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 xl:hidden" style={{ background: t.mobileOverlay }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 ml-0 md:ml-16 xl:ml-[260px] flex flex-col ${viewMode === 'gallery' ? 'h-screen overflow-hidden' : 'min-h-screen'}`} style={{ background: t.pageBg }}>

        {/* Header */}
        <header className="sticky top-0 z-10" style={{ background: t.headerBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${t.headerBorder}` }}>
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-xl transition-colors"
              style={{ color: t.textMuted }}
              onClick={() => setSidebarOpen(p => !p)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* URL insert bar */}
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: headerStatus === 'saved' ? '#10B981' : headerStatus === 'error' ? '#EF4444' : t.textMuted }} />
                <input
                  ref={headerInputRef}
                  type="text" value={headerUrl}
                  onChange={e => { setHeaderUrl(e.target.value); if (headerStatus !== 'idle') setHeaderStatus('idle'); }}
                  onKeyDown={e => { if (e.key === 'Enter' && headerUrl.trim()) handleHeaderSave(); }}
                  placeholder={headerStatus === 'saved' ? 'Link saved!' : headerStatus === 'error' ? 'Failed — try again' : tr('placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: t.inputBg, border: `1px solid ${headerStatus === 'saved' ? 'rgba(16,185,129,0.4)' : headerStatus === 'error' ? 'rgba(239,68,68,0.4)' : t.inputBorder}`, color: t.inputText }}
                  onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
                  onBlur={e => { e.currentTarget.style.borderColor = t.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              {headerUrl.trim() && (
                <button onClick={handleHeaderSave} disabled={headerStatus === 'loading'}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: t.accentBg }}>
                  {headerStatus === 'loading'
                    ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><ArrowRight className="w-4 h-4" /><span className="hidden sm:block">{tr('save')}</span></>}
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} title="Upload file"
                className="p-2 rounded-xl transition-all shrink-0"
                style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}`, color: t.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.30)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.controlContainerBorder; }}>
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Search button — hidden on mobile (bottom nav handles it) */}
            <button onClick={focusSearch} title="Search"
              className="hidden sm:block p-2 rounded-xl transition-all shrink-0"
              style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}`, color: t.textMuted }}
              onMouseEnter={e => { e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.30)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.controlContainerBorder; }}>
              <Search className="w-4 h-4" />
            </button>

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
              {selectMode ? tr('cancel') : tr('select')}
            </button>

            {/* Avatar */}
            <ProfileMenu onExport={handleExport} onImport={handleImport} onSignOut={async () => supabase.auth.signOut()} onShowUpgrade={() => setShowUpgrade(true)} onShowSettings={() => setShowSettings(true)} onShowLanguage={() => setShowLanguage(true)} onShowHelp={() => setShowHelp(true)} user={user} isPro={isPro} />
          </div>

          {/* Sub-header: title + sort */}
          <div className="px-4 sm:px-6 pb-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {/* Mobile collection arrows */}
              {(() => {
                const navList: Collection[] = [
                  'all', 'recent', 'favorites', 'unsorted',
                  ...categories.map(c => `cat:${c}` as Collection),
                ];
                const idx = navList.indexOf(selected as Collection);
                const goPrev = () => { if (idx > 0) setSelected(navList[idx - 1]); };
                const goNext = () => { if (idx < navList.length - 1) setSelected(navList[idx + 1]); };
                return (
                  <>
                    <button onClick={goPrev} disabled={idx <= 0}
                      className="md:hidden p-1 rounded-lg transition-colors disabled:opacity-25"
                      style={{ color: t.textMuted }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      className="md:hidden flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors active:opacity-70"
                      onClick={() => setSidebarOpen(true)}>
                      <h2 className="text-[17px] font-bold" style={{ color: t.textPrimary }}>{collectionLabel}</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium tabular-nums"
                        style={{ background: t.badgeBg, color: t.badgeText }}>
                        {filtered.length}
                      </span>
                    </button>
                    <div className="hidden md:flex items-center gap-2">
                      <h2 className="text-[17px] font-bold" style={{ color: t.textPrimary }}>{collectionLabel}</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium tabular-nums"
                        style={{ background: t.badgeBg, color: t.badgeText }}>
                        {filtered.length}
                      </span>
                    </div>
                    <button onClick={goNext} disabled={idx >= navList.length - 1}
                      className="md:hidden p-1 rounded-lg transition-colors disabled:opacity-25"
                      style={{ color: t.textMuted }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {(selected as string).startsWith('cat:') && (
                      <button
                        className="md:hidden p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textMuted }}
                        onClick={e => { e.stopPropagation(); setMobileBoardMenuRect(e.currentTarget.getBoundingClientRect()); setShowMobileBoardMenu(p => !p); }}>
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
            {/* Mobile sort: custom dropdown to avoid iOS native select sizing */}
            <div className="relative md:hidden">
              <button
                className="flex items-center gap-1 text-[12px] font-medium rounded-lg px-2 py-1"
                style={{ background: t.sortActiveBg, color: t.sortActiveText }}
                onClick={() => setShowMobileSortMenu(p => !p)}>
                {sortLabels[sortOption]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showMobileSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden w-28 z-50"
                    style={{ background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}>
                    {(['newest', 'oldest', 'a-z', 'z-a', ...(sortOption === 'custom' ? ['custom'] : [])] as SortOption[]).map(opt => (
                      <button key={opt} className="w-full px-3 py-2 text-left text-[12px]"
                        style={{ color: sortOption === opt ? '#7C3AED' : t.dropdownText, fontWeight: sortOption === opt ? 600 : 400 }}
                        onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => { setSortOption(opt); setShowMobileSortMenu(false); }}>
                        {sortLabels[opt]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Desktop sort: native select */}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="hidden md:block text-[12px] font-medium rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              style={{ background: t.sortActiveBg, color: t.sortActiveText, border: 'none' }}>
              {(['newest', 'oldest', 'a-z', 'z-a', ...(sortOption === 'custom' ? ['custom'] : [])] as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{sortLabels[opt]}</option>
              ))}
            </select>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────────────── */}
        <main className={`flex-1 pb-24 md:pb-5 ${viewMode === 'gallery' ? 'flex flex-col overflow-hidden px-4 sm:px-6 py-4' : 'px-4 sm:px-6 py-5'}`}>
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
              <p className="text-[15px] font-semibold" style={{ color: t.emptyTitle }}>{tr('nothingHere')}</p>
              <p className="text-[13px] mt-1.5" style={{ color: t.emptySub }}>{tr('addFirstLink')}</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanView
              links={links}
              selected={selected}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5" style={{ gridAutoRows: '275px' }}>
              {filtered.map(link => <LinkCard key={link.id} {...cardProps(link)} compact />)}
            </div>
          ) : viewMode === 'gallery' ? (
            <GalleryView links={filtered} favorites={favorites} />
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
                <h3 className="text-[16px] font-bold" style={{ color: t.modalTitle }}>Add to SaveBoard</h3>
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
                onKeyDown={e => { if (e.key === 'Enter' && !isAdding && urlInput.trim()) handleAddUrl(undefined, closeModal); }}
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
                File
              </button>
              <button onClick={() => handleAddUrl(undefined, closeModal)} disabled={isAdding || !urlInput.trim()}
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

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

      {/* ── Search overlay ────────────────────────────────────────────── */}
      {showSearch && (
        <>
          <div className="fixed inset-0 z-40 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
          <div className="fixed top-0 left-0 z-50 px-4 pt-4 pb-3 overflow-hidden" style={{ width: '100vw', background: t.headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.headerBorder}` }}>
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.textMuted }} />
                <input
                  ref={searchOverlayRef}
                  autoFocus
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); } }}
                  placeholder="Search links, notes, boards…"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputFocusBorder}`, boxShadow: t.inputFocusShadow, color: t.inputText }}
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4" style={{ color: t.textMuted }} />
                </button>
              </div>
              {searchQuery.trim() && (() => {
                const q = searchQuery.toLowerCase();
                const hits = links.filter(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)).slice(0, 8);
                if (!hits.length) return <p className="text-[13px] text-center py-4" style={{ color: t.textMuted }}>No results for "{searchQuery}"</p>;
                return (
                  <div className="mt-2 rounded-2xl overflow-hidden" style={{ background: t.searchDropBg, border: `1px solid ${t.searchDropBorder}` }}>
                    <div className="p-1.5">
                      {hits.map(l => {
                        const dom = (() => { try { return new URL(l.url).hostname.replace('www.', ''); } catch { return 'Note'; } })();
                        return (
                          <a key={l.id} href={l.url === '#' ? undefined : l.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                            style={{ color: t.searchDropItemText }}
                            onMouseEnter={e => (e.currentTarget.style.background = t.searchDropItemHoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.searchDropIconBg }}>
                              {l.image && !l.image.startsWith('placeholder:')
                                ? <img src={l.image} alt="" className="w-full h-full object-cover" />
                                : <Link2 className="w-3.5 h-3.5" style={{ color: t.textMuted }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">{l.title}</p>
                              <p className="text-[11px] truncate" style={{ color: t.searchDropSecondary }}>{dom}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* ── Mobile board 3-dots menu ─────────────────────────────────── */}
      {showMobileBoardMenu && mobileBoardMenuRect && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 298 }} onClick={() => setShowMobileBoardMenu(false)} />
          <div className="fixed rounded-2xl overflow-hidden w-44"
            style={{
              zIndex: 299,
              top: mobileBoardMenuRect.bottom + 6,
              left: Math.min(mobileBoardMenuRect.left, window.innerWidth - 184),
              background: t.dropdownBg,
              border: `1px solid ${t.dropdownBorder}`,
              boxShadow: t.dropdownShadow,
            }}>
            <div className="p-1">
              {(() => {
                const cat = (selected as string).replace('cat:', '');
                const row = 'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-left text-[13px]';
                return (
                  <>
                    <button className={row} style={{ color: t.dropdownText }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => {
                        setShowMobileBoardMenu(false);
                        const neu = window.prompt('Rename board:', cat);
                        if (neu && neu.trim() && neu.trim() !== cat) handleRenameCategory(cat, neu.trim());
                      }}>
                      <Pencil className="w-4 h-4" style={{ color: t.dropdownIcon }} />
                      Rename
                    </button>
                    <button className={row} style={{ color: t.dropdownText }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setShowMobileBoardMenu(false); setShareCategory(cat); }}>
                      <Share2 className="w-4 h-4" style={{ color: t.dropdownIcon }} />
                      Share
                    </button>
                    <div style={{ borderTop: `1px solid ${t.dropdownDivider}`, margin: '4px 0' }} />
                    <button className={row}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setShowMobileBoardMenu(false); handleDeleteCategory(cat); }}>
                      <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                      <span style={{ color: '#EF4444' }}>Delete</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Delete board confirm modal ────────────────────────────────── */}
      {deleteBoardConfirm && (
        <>
          <div className="fixed inset-0 z-[9990] bg-black/50" onClick={() => setDeleteBoardConfirm(null)} />
          <div className="fixed z-[9991] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl p-6 shadow-2xl"
            style={{ background: t.cardBg }}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: t.textPrimary }}>Delete "{deleteBoardConfirm.cat}"?</h3>
            <p className="text-[13px] mb-5" style={{ color: t.textMuted }}>
              This board has <strong>{deleteBoardConfirm.count}</strong> save{deleteBoardConfirm.count !== 1 ? 's' : ''}. What would you like to do with them?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => execDeleteCategory(deleteBoardConfirm.cat, false)}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-90"
                style={{ background: t.badgeBg, color: t.textPrimary }}>
                Keep saves → move to Unsorted
              </button>
              <button
                onClick={() => execDeleteCategory(deleteBoardConfirm.cat, true)}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#EF4444' }}>
                Delete saves too
              </button>
              <button
                onClick={() => setDeleteBoardConfirm(null)}
                className="w-full py-2 text-[13px] transition-opacity hover:opacity-70"
                style={{ color: t.textMuted }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Share modal ───────────────────────────────────────────────── */}
      {shareCategory && user && (
        <ShareModal
          category={shareCategory}
          userId={user.id}
          links={links.filter(l => l.category === shareCategory)}
          onClose={() => setShareCategory(null)}
        />
      )}

      {/* ── Bottom nav (mobile only) ───────────────────────────────────── */}
      <BottomNav
        selected={selected}
        onSelect={(id) => { setSelected(id); setSidebarOpen(false); }}
        onOpenAdd={() => setShowAddModal(true)}
        onFocusSearch={focusSearch}
        onOpenMore={() => setSidebarOpen(true)}
        favorites={favorites}
        hidden={sidebarOpen}
      />

      {/* ── Upgrade page ──────────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradePage
          onClose={() => setShowUpgrade(false)}
          currentLinks={links.length}
          currentBoards={categories.length}
        />
      )}

      {/* ── Language page ─────────────────────────────────────────────── */}
      {showLanguage && <LanguagePage onClose={() => setShowLanguage(false)} />}

      {/* ── Contact page ──────────────────────────────────────────────── */}
      {showContact && <ContactPage onClose={() => setShowContact(false)} user={user} />}

      {/* ── Help page ─────────────────────────────────────────────────── */}
      {showHelp && <HelpPage onClose={() => setShowHelp(false)} onShowContact={() => { setShowHelp(false); setShowContact(true); }} />}

      {/* ── Privacy page ──────────────────────────────────────────────── */}
      {showPrivacy && <PrivacyPage onClose={() => setShowPrivacy(false)} />}

      {/* ── Terms page ────────────────────────────────────────────────── */}
      {showTerms && <TermsPage onClose={() => setShowTerms(false)} />}

      {/* ── Settings page ─────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsPage
          onClose={() => setShowSettings(false)}
          user={user}
          onExport={handleExport}
          onImport={handleImport}
          onSignOut={async () => { await supabase.auth.signOut(); setShowSettings(false); }}
          onShowUpgrade={() => { setShowSettings(false); setShowUpgrade(true); }}
          onShowContact={() => setShowContact(true)}
          onShowHelp={() => setShowHelp(true)}
          onShowPrivacy={() => setShowPrivacy(true)}
          onShowTerms={() => setShowTerms(true)}
          linkCount={links.length}
          boardCount={categories.length}
          isPro={isPro}
        />
      )}
    </div>
  );
}
