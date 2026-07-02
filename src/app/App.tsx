import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { LinkCard, LinkData } from './components/LinkCard';
import { Sidebar, type Collection } from './components/Sidebar';
import { KanbanView } from './components/KanbanView';
import { GalleryView } from './components/GalleryView';
import { Board, loadBoards, createBoard, joinBoard, deleteBoard } from './lib/boards';
import { BottomNav } from './components/BottomNav';
import { ProfileMenu } from './components/ProfileMenu';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { Trash2, Paperclip, Search, Plus, LayoutGrid, List, Columns2, X, Menu, Bookmark, Kanban, Mic, MicOff, Link2, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, MoreVertical, Pencil, Share2, Check } from 'lucide-react';

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="8" rx="2" />
      <rect x="3" y="13" width="7" height="8" rx="2" />
      <rect x="12" y="3" width="9" height="18" rx="2" />
    </svg>
  );
}
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SendIntent } from 'send-intent';
import { InAppReview } from '@capacitor-community/in-app-review';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';

const HTML5toTouch = {
  backends: [
    { id: 'html5', backend: HTML5Backend, transition: MouseTransition },
    { id: 'touch', backend: TouchBackend, options: { enableMouseEvents: false, delayTouchStart: 200 }, transition: TouchTransition },
  ],
};
import { BoardShareModal } from './components/BoardShareModal';
import { UpgradePage, FREE_LIMITS } from './components/UpgradePage';
import { BillingPage } from './components/BillingPage';
import { SettingsPage } from './components/SettingsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { LanguagePage } from './components/LanguagePage';
import { ContactPage } from './components/ContactPage';
import { HelpPage } from './components/HelpPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { deriveAiTags } from './components/LinkCard';
import { HomePage } from './components/HomePage';

type ViewMode   = 'masonry' | 'grid' | 'gallery' | 'list' | 'kanban';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'custom';

const defaultCategories = ['Events', 'Recipes', 'Fitness'];

// Max files accepted in a single upload (e.g. a photo multi-select).
const MAX_UPLOAD_BATCH = 10;

// Dedup key for importing a shared board: real links dedup by URL, but memos/
// notes all share url '#', so those fall back to (lowercased) title — otherwise
// every memo after the first would collapse to the same key and never import.
const importDedupKey = (l: { url?: string; title?: string }): string => {
  const u = (l.url ?? '').trim();
  return u && u !== '#' ? `u:${u}` : `t:${(l.title ?? '').trim().toLowerCase()}`;
};

// Labels computed dynamically via tr() in AppContent

export default function App() {
  return <DndProvider backend={MultiBackend} options={HTML5toTouch}><ThemeProvider><LanguageProvider><AppContent /></LanguageProvider></ThemeProvider></DndProvider>;
}

function AppContent() {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const [user, setUser]                 = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [showAuth, setShowAuth]         = useState(() => new URLSearchParams(window.location.search).get('auth') === '1');
  const [links, setLinks]               = useState<LinkData[]>([]);
  const [boards, setBoards]             = useState<Board[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [isAdding, setIsAdding]         = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [urlInput, setUrlInput]         = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [selected, setSelected]         = useState<Collection>('all');
  const [viewMode, setViewMode]         = useState<ViewMode>('masonry');
  // On phones we always show the simple horizontal list (no detail/gallery panel).
  const [isMobile, setIsMobile]         = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [sortOption, setSortOption]     = useState<SortOption>('newest');
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addBoards, setAddBoards] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [shareBoardTarget, setShareBoardTarget] = useState<Board | null>(null);
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
  const [isPro, setIsPro] = useState(false);
  const [subData, setSubData] = useState<{ plan: string; status: string; billing_cycle: string; current_period_end: string; saves_limit: string; boards_limit: string; storage_limit: string } | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [showAdmin, setShowAdmin]     = useState(false);
  const [currentStorageMb, setCurrentStorageMb] = useState(0);
  const [sharedBoards, setSharedBoards] = useState<{ token: string; category: string; synced_at: string | null; count: number; views: number; viewers: { email: string | null; viewed_at: string }[] }[]>([]);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const searchRef       = useRef<HTMLDivElement>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);
  const headerInputRef  = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLInputElement>(null);

  // Boards are the source of truth; the rest of the UI still groups/displays by
  // board NAME (kept in each link's `category`), so `categories` = board names.
  const categories = boards.map(b => b.name);
  const boardByName = new Map(boards.map(b => [b.name, b] as const));
  const boardIdForName = (name: string): string | null =>
    (name && name !== 'None') ? (boardByName.get(name)?.id ?? null) : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));

    // Handle OAuth deep link callback (native only)
    let appUrlListener: { remove: () => void } | null = null;
    let sendIntentCleanup: (() => void) | null = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        // Shared-board deep link (opened from a share page stuck in an in-app browser):
        // open it inside the app, where the user is already signed in so "Save" works.
        const shareMatch = url.match(/\/\/share\/([^?#/]+)/);
        if (shareMatch) { window.location.href = `/share/${shareMatch[1]}`; return; }

        if (!url.includes('login-callback')) return;
        await Browser.close();

        // Extract params from query string or hash fragment
        const [, rest] = url.split(/[?#]/);
        const params = new URLSearchParams(rest ?? '');
        const code = params.get('code');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error('exchangeCodeForSession error:', error.message);
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) console.error('setSession error:', error.message);
        }
      }).then(l => { appUrlListener = l; });

      // Android share-target: when a link/text is shared into SaveBoard from
      // another app's share sheet, open the Add modal pre-filled with the URL.
      const handleSendIntent = () => {
        SendIntent.checkSendIntentReceived()
          .then((result: { title?: string; url?: string } | undefined) => {
            if (!result) return;
            const raw = result.url || result.title || '';
            if (!raw) return;
            let shared = raw;
            try { shared = decodeURIComponent(raw); } catch { /* keep raw */ }
            const urlMatch = shared.match(/https?:\/\/[^\s]+/);
            setUrlInput(urlMatch ? urlMatch[0] : shared.trim());
            setShowAddModal(true);
          })
          .catch(() => { /* nothing shared */ });
      };
      handleSendIntent(); // cold start: app launched directly from a share
      window.addEventListener('sendIntentReceived', handleSendIntent);
      sendIntentCleanup = () => window.removeEventListener('sendIntentReceived', handleSendIntent);
    }

    return () => {
      subscription.unsubscribe();
      appUrlListener?.remove();
      sendIntentCleanup?.();
    };
  }, []);

  useEffect(() => {
    if (!user) { setIsPro(false); setSubData(null); return; }
    supabase
      .from('subscriptions')
      .select('status, plan, billing_cycle, current_period_end, saves_limit, boards_limit, file_size_limit, storage_limit')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const active = data?.status === 'active' && (data?.plan === 'pro' || data?.plan === 'team');
        setIsPro(active);
        setSubData(data ?? null);
      });
  }, [user]);

  // Seed the Add modal's board multi-select with the currently-viewed board.
  useEffect(() => {
    if (showAddModal) {
      setAddBoards(selected.startsWith('cat:') ? new Set([selected.slice(4)]) : new Set());
    }
  }, [showAddModal]);

  useEffect(() => {
    if (!user) { setCurrentStorageMb(0); return; }
    supabase.storage.from('pdfs').list(user.id, { limit: 1000 }).then(({ data }) => {
      if (!data) return;
      const totalBytes = data.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
      setCurrentStorageMb(Math.round((totalBytes / (1024 * 1024)) * 10) / 10);
    });
  }, [user]);

  const fetchSharedBoards = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('shared_boards')
      .select('token, category, synced_at, links_snapshot, view_count')
      .eq('owner_id', uid)
      .order('synced_at', { ascending: false });
    if (!data) return;
    const tokens = data.map((b: any) => b.token);
    const { data: viewData } = tokens.length
      ? await supabase
          .from('shared_board_views')
          .select('token, viewer_email, viewed_at')
          .in('token', tokens)
          .order('viewed_at', { ascending: false })
      : { data: [] };

    const viewsByToken: Record<string, { email: string | null; viewed_at: string }[]> = {};
    (viewData ?? []).forEach((v: any) => {
      if (!viewsByToken[v.token]) viewsByToken[v.token] = [];
      const seen = viewsByToken[v.token];
      const key = v.viewer_email ?? '__anon__';
      if (!seen.some(x => (x.email ?? '__anon__') === key)) {
        seen.push({ email: v.viewer_email, viewed_at: v.viewed_at });
      }
    });
    setSharedBoards(data.map((b: any) => ({
      token: b.token,
      category: b.category,
      synced_at: b.synced_at,
      count: Array.isArray(b.links_snapshot) ? b.links_snapshot.length : 0,
      views: b.view_count ?? 0,
      viewers: viewsByToken[b.token] ?? [],
    })));
  }, []);

  useEffect(() => {
    if (!user) { setSharedBoards([]); return; }
    fetchSharedBoards(user.id);

    // Refetch when the tab regains focus
    const onFocus = () => fetchSharedBoards(user.id);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, fetchSharedBoards]);

  // Handle items shared from iOS Share Extension via App Group pending queue
  useEffect(() => {
    if (!user) return;
    const handler = async (e: Event) => {
      const items = (e as CustomEvent<Array<{ type: string; url?: string; text?: string; imageBase64?: string }>>).detail;
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (item.type === 'url' && item.url) {
          await handleAddUrl(item.url);
        } else if (item.type === 'text' && item.text) {
          await handleAddUrl(item.text);
        } else if (item.type === 'image' && item.imageBase64) {
          try {
            const { generateId } = await import('./utils/metadataFetcher');
            const id = generateId();
            const byteString = atob(item.imageBase64);
            const bytes = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const path = `${user.id}/${id}-shared.jpg`;
            const { error: ue } = await supabase.storage.from('pdfs').upload(path, blob, { contentType: 'image/jpeg' });
            if (ue) throw ue;
            const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path);
            const cat = selected.startsWith('cat:') ? selected.slice(4) : 'None';
            const nl = { id, user_id: user.id, url: publicUrl, title: 'Shared Image', description: '', image: publicUrl, category: cat, board_id: boardIdForName(cat), created_at: Date.now() };
            const { error } = await supabase.from('links').insert(nl);
            if (!error) setLinks(p => [{ ...nl, boardId: nl.board_id, savedAt: new Date(nl.created_at) }, ...p]);
          } catch { /* silent */ }
        }
      }
    };
    window.addEventListener('saveboard-share', handler);
    return () => window.removeEventListener('saveboard-share', handler);
  }, [user]);

  useEffect(() => {
    if (!user) { setLinks([]); setBoards([]); return; }
    (async () => {
      // Auto-join a pending board invite (from the /team/<token> sign-in flow)
      // before loading, so the joined board shows up right away.
      const pend = localStorage.getItem('saveboard-pending-team');
      if (pend) { localStorage.removeItem('saveboard-pending-team'); try { await joinBoard(pend); } catch { /* */ } }

      const loaded = await loadData();
      await handlePendingImport();

      // Deep links: ?board=<name> (share import) or ?team=<id> (just joined).
      const params = new URLSearchParams(window.location.search);
      const boardName = params.get('board');
      const teamId = params.get('team');
      if (boardName) {
        setSelected(`cat:${boardName}`);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (teamId) {
        const b = (loaded ?? []).find(x => x.id === teamId);
        if (b) setSelected(`cat:${b.name}`);
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, [user]);

  const handlePendingImport = async () => {
    const token = localStorage.getItem('saveboard-pending-import');
    if (!token || !user) return;
    localStorage.removeItem('saveboard-pending-import');
    try {
      const { data } = await supabase
        .rpc('get_shared_board', { p_token: token })
        .single();
      if (!data) return;

      const catName = data.category;
      // Ensure a board with this name exists (create via RPC if needed), and
      // point the imported links at it.
      const { data: existingBoard } = await supabase
        .from('boards').select('id').eq('owner_id', user.id).eq('name', catName).maybeSingle();
      let importBoardId = existingBoard?.id as string | undefined;
      if (!importBoardId) {
        const { board } = await createBoard(catName);
        importBoardId = board?.id;
        if (board) setBoards(p => [...p, board]);
      }

      // Dedup within the target board only (so a link already saved in a
      // different board still gets copied here), keyed so memos don't collapse.
      const { data: existingLinksData } = await supabase.from('links').select('url, title, category').eq('user_id', user!.id).eq('board_id', importBoardId ?? '');
      const seen = new Set((existingLinksData ?? []).map((l: any) => importDedupKey(l)));
      const candidates = (data.links_snapshot as any[]).filter((l: any) => {
        const k = importDedupKey(l);
        if (seen.has(k)) return false;
        seen.add(k);  // also dedup within the snapshot itself
        return true;
      });

      // Respect the Free plan saves limit (the import path never checked it).
      // Query plan + total directly — both the `isPro` and `links` state are
      // stale right after login (their effects haven't re-rendered this yet).
      let toImport = candidates;
      const { data: sub } = await supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle();
      const planIsPro = sub?.status === 'active' && (sub?.plan === 'pro' || sub?.plan === 'team');
      if (!planIsPro) {
        const { count: totalCount } = await supabase.from('links').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        const remaining = Math.max(0, FREE_LIMITS.links - (totalCount ?? 0));
        if (candidates.length > remaining) {
          toImport = candidates.slice(0, remaining);
          if (remaining === 0) setShowUpgrade(true);
        }
      }

      const newLinks = toImport.map((l: any) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        url: l.url,
        title: l.title,
        description: l.description || '',
        image: l.image || '',
        category: catName,
        board_id: importBoardId ?? null,
        created_at: Date.now(),
      }));
      if (newLinks.length > 0) {
        await supabase.from('links').insert(newLinks);
        setLinks(p => [...newLinks.map((l: any) => ({ ...l, boardId: l.board_id, savedAt: new Date(l.created_at) })), ...p]);
      }
      window.location.href = `${window.location.origin}?board=${encodeURIComponent(catName)}`;
    } catch (e) { console.error(e); }
  };

  const loadData = async (): Promise<Board[]> => {
    setIsLoading(true);
    try {
      // Boards (source of truth). Seed defaults for a brand-new account.
      let bs = await loadBoards(user!.id);
      if (!bs.length) {
        for (const name of defaultCategories) { const { board } = await createBoard(name); if (board) bs.push(board); }
      }
      setBoards(bs);
      const nameById = new Map(bs.map(b => [b.id, b.name] as const));

      // My own links, plus links from boards I've joined (owned by others).
      const { data: ownLd } = await supabase.from('links').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      const memberIds = bs.filter(b => b.role === 'member').map(b => b.id);
      const { data: sharedLd } = memberIds.length
        ? await supabase.from('links').select('*').in('board_id', memberIds).order('created_at', { ascending: false })
        : { data: [] as any[] };

      // A member's own row could also be their board's link; dedup by id.
      const byId = new Map<string, any>();
      [...(ownLd ?? []), ...(sharedLd ?? [])].forEach(l => { if (!byId.has(l.id)) byId.set(l.id, l); });
      const all = Array.from(byId.values());

      // Group/display key = the board's name. A link is Unsorted ('None') when it
      // has no board_id OR points at a board we don't surface (e.g. the legacy
      // 'None' board) — in that case we also drop its stale boardId.
      let mapped = all.map(l => {
        const known = l.board_id && nameById.has(l.board_id);
        return {
          ...l,
          boardId: known ? l.board_id : null,
          category: known ? nameById.get(l.board_id) : 'None',
          savedAt: new Date(l.created_at),
        };
      });
      try {
        const stored = localStorage.getItem(`sb_order_${user!.id}`);
        if (stored) {
          const order: string[] = JSON.parse(stored);
          const orderMap = new Map(order.map((id, i) => [id, i]));
          mapped = mapped.sort((a, b) => (orderMap.get(a.id) ?? 999999) - (orderMap.get(b.id) ?? 999999));
          setSortOption('custom');
        } else {
          mapped = mapped.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
        }
      } catch {}
      setLinks(mapped);
      setFavorites(new Set(all.filter(l => l.is_favorite).map((l: any) => l.id)));
      return bs;
    } catch (e) { console.error(e); return []; }
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
        // Case-insensitive to match how the sidebar counts tags (user tags may
        // be stored with mixed case, e.g. "Hotel").
        if ((l.tags ?? []).some(x => x.trim().toLowerCase() === tag)) return true;
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
  const closeModal = () => { setShowAddModal(false); setUrlInput(''); setErrorMessage(''); setSuccessMessage(''); setInfoMessage(''); setAddBoards(new Set()); };

  // Ask for a store rating at a positive moment (50+ links saved, or 5+ boards),
  // once per user. Native in-app review dialog — no app exit. No-op on web.
  const maybeAskReview = async (totalLinks: number, totalBoards: number) => {
    if (!Capacitor.isNativePlatform()) return;
    if (localStorage.getItem('sb_review_asked') === '1') return;
    if (totalLinks < 50 && totalBoards < 5) return;
    localStorage.setItem('sb_review_asked', '1');
    try { await InAppReview.requestReview(); } catch { /* unsupported on device — ignore */ }
  };

  // Explicit "Rate SaveBoard" action (Settings) — opens the store's review page.
  const handleRate = async () => {
    const ios = Capacitor.getPlatform() === 'ios';
    const url = ios
      ? 'https://apps.apple.com/app/id6770486850?action=write-review'
      : 'https://play.google.com/store/apps/details?id=app.saveboard.saveboard';
    if (Capacitor.isNativePlatform()) { try { await Browser.open({ url }); return; } catch { /* fall through */ } }
    window.open(url, '_blank');
  };

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
    setErrorMessage(''); setSuccessMessage(''); setInfoMessage(''); setIsAdding(true);
    // Target boards: the multi-select from the Add modal if any, else the
    // currently-viewed board. The same item is copied into each.
    const defaultCategory = selected.startsWith('cat:') ? selected.slice(4) : 'None';
    const targetCats = addBoards.size ? Array.from(addBoards) : [defaultCategory];
    const boardSuffix = (n: number) => n > 1 ? ` to ${n} boards` : '';
    try {
      const { fetchMetadata, generateId } = await import('./utils/metadataFetcher');
      const { parseEmbedCode } = await import('./utils/embedParser');

      // Insert one copy of `base` (no id/category/created_at) into each board.
      const insertInto = async (base: Record<string, any>, cats: string[]) => {
        const rows = cats.map(cat => ({ ...base, id: generateId(), category: cat, board_id: boardIdForName(cat), created_at: Date.now() }));
        const { error } = await supabase.from('links').insert(rows);
        if (error) throw error;
        setLinks(p => [...rows.map(r => ({ ...r, boardId: r.board_id, savedAt: new Date(r.created_at) })), ...p]);
        return rows.length;
      };

      const embedData = parseEmbedCode(input);
      if (embedData) {
        const n = await insertInto({ user_id: user.id, url: embedData.url, title: embedData.title || 'Embedded Content', description: embedData.description || '', image: embedData.image || 'placeholder:default' }, targetCats);
        setUrlInput(''); setSuccessMessage(`Added${boardSuffix(n)}!`); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.(); maybeAskReview(links.length + n, categories.length); return;
      }

      const looksLikeUrl = /^https?:\/\//i.test(input) || /^www\./i.test(input);
      let isValidUrl = false;
      if (looksLikeUrl) { try { new URL(input.startsWith('www.') ? 'https://' + input : input); isValidUrl = true; } catch { /**/ } }

      if (!isValidUrl) {
        const n = await insertInto({ user_id: user.id, url: '#', title: input.slice(0, 100), description: '', image: 'placeholder:memo' }, targetCats);
        setUrlInput(''); setSuccessMessage(`Note saved${boardSuffix(n)}!`); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.(); return;
      }

      const url = input.startsWith('www.') ? 'https://' + input : input;
      // Per-board dedup: only copy into boards that don't already have this URL.
      const cats = targetCats.filter(cat => !links.some(l => l.url === url && l.category === cat));
      if (cats.length === 0) { setErrorMessage('Already saved'); return; }
      const meta = await fetchMetadata(url);
      const n = await insertInto({ user_id: user.id, url, title: meta.title || 'Web Page', description: meta.description || '', image: meta.image || 'placeholder:default' }, cats);
      setUrlInput(''); setSuccessMessage(`Link added${boardSuffix(n)}!`); setTimeout(() => setSuccessMessage(''), 2500); onSuccess?.();
      maybeAskReview(links.length + n, categories.length);
    } catch { setErrorMessage('Failed. Please try again.'); }
    finally { setIsAdding(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !user) return;
    const clearInput = () => { if (fileInputRef.current) fileInputRef.current.value = ''; };

    const isTeam        = subData?.plan === 'team';
    const maxMb         = isTeam ? 50    : isPro ? 20   : FREE_LIMITS.fileSizeMb;   // per-file
    const storageCapMb  = isTeam ? 10240 : isPro ? 2048 : FREE_LIMITS.storageMb;    // total
    const planLabel     = isTeam ? 'Team' : isPro ? 'Pro' : 'Free';

    setErrorMessage(''); setSuccessMessage(''); setInfoMessage('');

    let files = Array.from(fileList);
    const info: string[] = [];    // soft notices (limits / skips) — amber
    const errors: string[] = [];  // hard failures — red

    // Target boards: the Add modal multi-select if any, else the current board.
    // Each uploaded file is copied (as a link row) into every target board.
    const targetCats = addBoards.size ? Array.from(addBoards) : [selected.startsWith('cat:') ? selected.slice(4) : 'None'];

    if (files.length > MAX_UPLOAD_BATCH) {
      info.push(`Max ${MAX_UPLOAD_BATCH} files at once — extra files skipped.`);
      files = files.slice(0, MAX_UPLOAD_BATCH);
    }
    // Free plan: don't blow past the saves quota. Each file becomes one row per
    // target board, so a file costs `targetCats.length` saves.
    if (!isPro) {
      const remaining = FREE_LIMITS.links - links.length;
      const maxFiles = Math.floor(remaining / targetCats.length);
      if (maxFiles <= 0) { setShowUpgrade(true); clearInput(); return; }
      if (files.length > maxFiles) {
        info.push(`Only room for ${maxFiles} more file${maxFiles !== 1 ? 's' : ''} on the Free plan.`);
        files = files.slice(0, maxFiles);
      }
    }

    setIsAdding(true); setIsUploading(true);

    const { generateId } = await import('./utils/metadataFetcher');
    const newLinks: any[] = [];
    let runningStorageMb = currentStorageMb;
    let uploadedFiles = 0, skippedSize = 0, skippedStorage = 0, failed = 0, bucketMissing = false;

    for (const file of files) {
      const fileMb = file.size / (1024 * 1024);
      if (file.size > maxMb * 1024 * 1024)        { skippedSize++; continue; }
      if (runningStorageMb + fileMb > storageCapMb) { skippedStorage++; continue; }
      try {
        const id = generateId();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${id}-${safe}`;
        const { error: ue } = await supabase.storage.from('pdfs').upload(path, file, { contentType: file.type });
        if (ue) throw ue;
        const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path);
        const isImage = file.type.startsWith('image/');
        const isPdf   = file.type === 'application/pdf';
        const ext     = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
        // For PDFs, render page 1 to a real thumbnail; fall back to the
        // generic placeholder if rendering or its upload fails.
        let imageVal = isImage ? publicUrl : isPdf ? 'placeholder:pdf' : 'placeholder:file';
        if (isPdf) {
          try {
            const { renderPdfThumbnail } = await import('./utils/pdfThumbnail');
            const thumb = await renderPdfThumbnail(file);
            if (thumb) {
              const thumbPath = `${user.id}/${id}-thumb.jpg`;
              const { error: te } = await supabase.storage.from('pdfs').upload(thumbPath, thumb, { contentType: 'image/jpeg' });
              if (!te) {
                imageVal = supabase.storage.from('pdfs').getPublicUrl(thumbPath).data.publicUrl;
                runningStorageMb += thumb.size / (1024 * 1024);
              }
            }
          } catch { /* keep placeholder */ }
        }
        const base = { user_id: user.id, url: publicUrl, title: file.name.replace(/\.[^.]+$/, ''), description: `${ext} • ${(file.size / 1024).toFixed(0)} KB`, image: imageVal };
        const rows = targetCats.map(cat => ({ ...base, id: generateId(), category: cat, board_id: boardIdForName(cat), created_at: Date.now() }));
        const { error } = await supabase.from('links').insert(rows);
        if (error) throw error;
        rows.forEach(r => newLinks.push({ ...r, boardId: r.board_id, savedAt: new Date(r.created_at) }));
        uploadedFiles++;
        runningStorageMb += fileMb;
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes('bucket')) { bucketMissing = true; break; }
        failed++;
      }
    }

    if (newLinks.length) {
      setLinks(p => [...newLinks, ...p]);
      setCurrentStorageMb(Math.round(runningStorageMb * 10) / 10);
    }

    // Soft notices (limits hit) → amber info; hard failures → red error.
    if (skippedSize)    info.push(`${skippedSize} over the ${maxMb}MB ${planLabel} file limit.`);
    if (skippedStorage) info.push(`${skippedStorage} skipped — storage full.`);
    if (failed)         errors.push(`${failed} failed to upload.`);
    if (bucketMissing)  errors.push('Storage bucket not set up — check Supabase.');

    if (uploadedFiles) {
      const boardSuffix = targetCats.length > 1 ? ` to ${targetCats.length} boards` : '';
      setSuccessMessage(`${uploadedFiles} file${uploadedFiles !== 1 ? 's' : ''} uploaded${boardSuffix}!`);
      setTimeout(() => setSuccessMessage(''), 2500);
      if (info.length === 0 && errors.length === 0) { setShowAddModal(false); setAddBoards(new Set()); }
    }
    if (info.length)   setInfoMessage(info.join(' '));
    if (errors.length) setErrorMessage(errors.join(' '));
    if ((skippedSize || skippedStorage) && !isPro) setShowUpgrade(true);

    setIsAdding(false); setIsUploading(false); clearInput();
  };

  // Move a link to another board (by name). board_id is authoritative; category
  // is kept in sync as the display fallback.
  const handleUpdateCategory  = async (id: string, cat: string) => { const bid = boardIdForName(cat); await supabase.from('links').update({ board_id: bid, category: cat }).eq('id', id); setLinks(p => p.map(l => l.id === id ? { ...l, boardId: bid, category: cat } : l)); };
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
    const { board, error } = await createBoard(t);
    if (error) {
      if (/board_limit/.test(error)) setShowUpgrade(true);
      else setErrorMessage('Could not create the board. Please try again.');
      return;
    }
    if (board) { setBoards(p => [...p, board]); maybeAskReview(links.length, categories.length + 1); }
  };
  // Drag-reorder boards; persists sort_order per board (synced across devices).
  const handleReorderCategory = async (dragCat: string, dropCat: string) => {
    if (dragCat === dropCat || !user) return;
    let next: Board[] = [];
    setBoards(prev => {
      const arr = [...prev];
      const from = arr.findIndex(b => b.name === dragCat), to = arr.findIndex(b => b.name === dropCat);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      next = arr;
      return arr;
    });
    await Promise.all(next.map((b, i) => supabase.from('boards').update({ sort_order: i }).eq('id', b.id)));
  };
  const handleRenameCategory = async (old: string, neu: string) => {
    const t = neu.trim();
    const b = boardByName.get(old);
    if (!b) return;
    if (categories.includes(t)) { alert('Name already exists'); return; }
    await supabase.from('boards').update({ name: t }).eq('id', b.id);
    await supabase.from('links').update({ category: t }).eq('board_id', b.id);
    setBoards(p => p.map(x => x.id === b.id ? { ...x, name: t } : x));
    setLinks(p => p.map(l => l.boardId === b.id ? { ...l, category: t } : l));
    if (selected === `cat:${old}`) setSelected(`cat:${t}`);
  };
  const handleDeleteCategory = (cat: string) => {
    const count = links.filter(l => l.category === cat).length;
    if (count > 0) { setDeleteBoardConfirm({ cat, count }); return; }
    execDeleteCategory(cat, false);
  };

  const execDeleteCategory = async (cat: string, deleteSaves: boolean) => {
    setDeleteBoardConfirm(null);
    const b = boardByName.get(cat);
    if (!b) return;
    if (deleteSaves) {
      await supabase.from('links').delete().eq('board_id', b.id);
      setLinks(p => p.filter(l => l.boardId !== b.id));
    } else {
      await supabase.from('links').update({ board_id: null, category: 'None' }).eq('board_id', b.id);
      setLinks(p => p.map(l => l.boardId === b.id ? { ...l, boardId: null, category: 'None' } : l));
    }
    await deleteBoard(b.id);
    setBoards(p => p.filter(x => x.id !== b.id));
    if (selected === `cat:${cat}`) setSelected('all');
  };
  const focusSearch = () => { setShowSearch(true); setTimeout(() => searchOverlayRef.current?.focus(), 50); };

  const refreshSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan, billing_cycle, current_period_end, saves_limit, boards_limit, file_size_limit, storage_limit')
      .eq('user_id', user.id)
      .maybeSingle();
    const active = data?.status === 'active' && (data?.plan === 'pro' || data?.plan === 'team');
    setIsPro(active);
    setSubData(data ?? null);
    return active;
  };

  const handleRestorePurchases = async () => {
    if (!user) throw new Error('Not signed in');
    if (Capacitor.isNativePlatform()) {
      const { StoreKit } = await import('./lib/storekit');
      const { transactions } = await StoreKit.restorePurchases();
      if (!transactions.length) throw new Error('No active subscription found');
      // Record the most recent active transaction in Supabase
      const tx = transactions[0];
      const isYearly = tx.productId.includes('yearly');
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: 'pro',
        status: 'active',
        billing_cycle: isYearly ? 'yearly' : 'monthly',
        current_period_end: tx.expiresDate ?? null,
        saves_limit: '300',
        boards_limit: '30',
        file_size_limit: '20MB',
        storage_limit: '2GB',
        source: 'apple',
      }, { onConflict: 'user_id' });
      await refreshSubscription();
    } else {
      const active = await refreshSubscription();
      if (!active) throw new Error('No active subscription found');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const { error } = await res.json();
    if (error) throw new Error(error);
    await supabase.auth.signOut();
  };

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

    // Re-create a board per distinct category name (best-effort — ignores tier
    // caps here) and point each imported link at it via board_id.
    const nameToId = new Map(boards.map(b => [b.name, b.id] as const));
    const wantCats = Array.from(new Set(data.links.map((l: any) => l.category).filter((c: any) => c && c !== 'None'))) as string[];
    const createdBoards: Board[] = [];
    for (const name of wantCats) {
      if (nameToId.has(name)) continue;
      const { data: existing } = await supabase.from('boards').select('id').eq('owner_id', user!.id).eq('name', name).maybeSingle();
      if (existing?.id) { nameToId.set(name, existing.id); continue; }
      const { board } = await createBoard(name);
      if (board) { nameToId.set(name, board.id); createdBoards.push(board); }
    }
    if (createdBoards.length) setBoards(p => [...p, ...createdBoards]);

    // Only write real columns; drop client-only fields (boardId, savedAt).
    const il = data.links.map((l: any) => {
      const cat = l.category && l.category !== 'None' ? l.category : 'None';
      return {
        id: crypto.randomUUID(), user_id: user!.id,
        url: l.url, title: l.title, description: l.description || '', image: l.image || '',
        category: cat, board_id: nameToId.get(cat) ?? null,
        notes: l.notes ?? null, tags: l.tags ?? null, is_favorite: !!l.is_favorite,
        created_at: l.savedAt ? new Date(l.savedAt).getTime() : Date.now(),
      };
    });
    await supabase.from('links').insert(il);
    setLinks(il.map((l: any) => ({ ...l, boardId: l.board_id, savedAt: new Date(l.created_at) })));
    setFavorites(new Set(il.filter((l: any) => l.is_favorite).map((l: any) => l.id)));
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
    onDeleteCategory: handleDeleteCategory, onReorderCategory: handleReorderCategory,
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
        boards={boards}
        selected={selected}
        onSelect={(id) => { setSelected(id); setSidebarOpen(false); }}
        links={links}
        favorites={favorites}
        onAddCategory={handleAddCategory}
        onReorderCategory={handleReorderCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onShareCategory={cat => setShareBoardTarget(boardByName.get(cat) ?? null)}
        onUpdateCategory={handleUpdateCategory}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 xl:hidden" style={{ background: t.mobileOverlay }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 ml-0 md:ml-16 xl:ml-[260px] flex flex-col ${!isMobile && viewMode === 'gallery' ? 'h-screen overflow-hidden' : 'min-h-screen'}`} style={{ background: t.pageBg }}>

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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-all"
                  style={{ background: t.inputBg, border: `1px solid ${headerStatus === 'saved' ? 'rgba(16,185,129,0.4)' : headerStatus === 'error' ? 'rgba(239,68,68,0.4)' : t.inputBorder}`, color: t.inputText, fontSize: '16px' }}
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
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Upload file"
                className="p-2 rounded-xl transition-all shrink-0 disabled:opacity-60"
                style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}`, color: t.textMuted }}
                onMouseEnter={e => { if (isUploading) return; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.30)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.controlContainerBorder; }}>
                {isUploading
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <Paperclip className="w-4 h-4" />}
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

            {/* View mode — hidden on home dashboard */}
            <div className={`${selected === 'all' ? 'hidden' : 'hidden sm:flex'} items-center p-1 rounded-xl gap-0.5`} style={{ background: t.controlContainerBg, border: `1px solid ${t.controlContainerBorder}` }}>
              {viewModes.map(({ mode, Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={label}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: viewMode === mode ? t.controlActiveBg : 'transparent', color: viewMode === mode ? t.controlActiveColor : t.controlInactiveColor }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Select toggle — hidden on home dashboard */}
            <button onClick={() => { setSelectMode(p => !p); setSelectedIds(new Set()); }}
              className={`${selected === 'all' ? 'hidden' : 'hidden sm:block'} px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all`}
              style={{ background: selectMode ? t.selectBtnActiveBg : t.selectBtnBg, color: selectMode ? t.selectBtnActiveText : t.selectBtnText, border: `1px solid ${selectMode ? t.selectBtnActiveBorder : t.selectBtnBorder}` }}>
              {selectMode ? tr('cancel') : tr('select')}
            </button>

            {/* Avatar */}
            <ProfileMenu onExport={handleExport} onImport={handleImport} onSignOut={async () => supabase.auth.signOut()} onShowUpgrade={() => setShowUpgrade(true)} onShowBilling={() => setShowBilling(true)} onShowSettings={() => setShowSettings(true)} onShowLanguage={() => setShowLanguage(true)} onShowHelp={() => setShowHelp(true)} onShowAdmin={['michcopski@gmail.com','admin@saveboard.app'].includes(user?.email ?? '') ? () => setShowAdmin(true) : undefined} user={user} isPro={isPro} currentLinks={links.length} currentBoards={categories.length} currentStorageMb={currentStorageMb} />
          </div>

          {/* Sub-header: title + sort — hidden on home dashboard */}
          {selected !== 'all' && <div className="px-4 sm:px-6 pb-3.5 flex items-center justify-between gap-4">
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
                    {(selected as string).startsWith('cat:') && (
                      <button onClick={() => setShareBoardTarget(boardByName.get(selected.slice(4)) ?? null)}
                        title="Share / invite people"
                        className="hidden md:flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: t.accentBg }}>
                        <Share2 className="w-3.5 h-3.5" />Share
                      </button>
                    )}
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
          </div>}
        </header>

        {/* ── Content ────────────────────────────────────────────────── */}
        <main className={`flex-1 pb-24 md:pb-5 ${selected === 'all' ? 'px-4 sm:px-6 py-5' : !isMobile && viewMode === 'gallery' ? 'flex flex-col overflow-hidden px-4 sm:px-6 py-4' : 'px-4 sm:px-6 py-5'}`}>
          {selected === 'all' ? (
            <HomePage
              links={links}
              categories={categories}
              favorites={favorites}
              userEmail={user?.email}
              sharedBoards={sharedBoards}
              onSelect={(id) => { setSelected(id); setSidebarOpen(false); if (id === 'all' && user) fetchSharedBoards(user.id); }}
              cardProps={cardProps}
            />
          ) : isLoading ? (
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
          ) : isMobile ? (
            // Phones: Pinterest-style 2-column card grid.
            <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2 }}>
              <Masonry gutter="12px">
                {filtered.map(link => <LinkCard key={link.id} {...cardProps(link)} />)}
              </Masonry>
            </ResponsiveMasonry>
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
            <GalleryView links={filtered} favorites={favorites} categories={categories}
              onUpdateLink={handleUpdateLink} onUpdateTags={handleUpdateTags}
              onToggleFavorite={handleToggleFavorite} onUpdateCategory={handleUpdateCategory}
              onDelete={handleDeleteLink} />
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
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all"
                style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText, fontSize: '16px' }}
                onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
                onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {errorMessage && <p className="text-[12px] text-red-500/90 mb-3 px-1">{errorMessage}</p>}
            {infoMessage && <p className="text-[12px] text-amber-600/90 mb-3 px-1">{infoMessage}</p>}
            {successMessage && <p className="text-[12px] text-green-600/90 mb-3 px-1">{successMessage}</p>}

            {/* Board picker — select one or more boards to copy into */}
            {categories.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold mb-1.5 px-1" style={{ color: t.modalSubtitle }}>
                  Add to board{addBoards.size > 1 ? `s · ${addBoards.size} selected` : ''}
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[96px] overflow-y-auto">
                  {categories.map(cat => {
                    const on = addBoards.has(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => setAddBoards(prev => { const s = new Set(prev); s.has(cat) ? s.delete(cat) : s.add(cat); return s; })}
                        className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1"
                        style={on
                          ? { background: t.accentBg, color: '#fff' }
                          : { background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}>
                        {on && <Check className="w-3 h-3" />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={isAdding || isUploading}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50"
                style={{ background: t.modalPdfBg, border: `1px solid ${t.modalPdfBorder}`, color: t.modalPdfText }}>
                {isUploading
                  ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <Paperclip className="w-3.5 h-3.5" />}
                {isUploading ? 'Uploading…' : 'File'}
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
      <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,application/pdf,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />

      {/* Upload-in-progress overlay (shows regardless of which trigger started the upload) */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[4px]" style={{ background: t.modalBackdrop }}>
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: t.modalTitle }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-[14px] font-medium" style={{ color: t.modalTitle }}>Uploading…</span>
          </div>
        </div>
      )}

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
                  className="w-full pl-10 pr-10 py-3 rounded-xl focus:outline-none transition-all"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputFocusBorder}`, boxShadow: t.inputFocusShadow, color: t.inputText, fontSize: '16px' }}
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
                      onClick={() => { setShowMobileBoardMenu(false); setShareBoardTarget(boardByName.get(cat) ?? null); }}>
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

      {/* ── Board share modal (invite members + public link) ──────────── */}
      {shareBoardTarget && user && (
        <BoardShareModal
          board={shareBoardTarget}
          user={user}
          links={links.filter(l => l.category === shareBoardTarget.name)}
          onClose={() => setShareBoardTarget(null)}
          onBoardsChanged={() => loadBoards(user.id).then(setBoards)}
          onShowUpgrade={() => setShowUpgrade(true)}
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
          currentStorageMb={currentStorageMb}
          userId={user?.id}
          userEmail={user?.email}
          isPro={isPro}
          onPurchaseSuccess={refreshSubscription}
          onShowTerms={() => setShowTerms(true)}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}

      {showBilling && (
        <BillingPage
          onClose={() => setShowBilling(false)}
          onShowUpgrade={() => { setShowBilling(false); setShowUpgrade(true); }}
          onRestorePurchases={handleRestorePurchases}
          userId={user?.id}
          currentLinks={links.length}
          currentBoards={categories.length}
          currentStorageMb={currentStorageMb}
          subData={subData}
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
          onDeleteAccount={handleDeleteAccount}
          onShowUpgrade={() => { setShowSettings(false); setShowUpgrade(true); }}
          onShowContact={() => setShowContact(true)}
          onShowHelp={() => setShowHelp(true)}
          onRate={handleRate}
          onShowPrivacy={() => setShowPrivacy(true)}
          onShowTerms={() => setShowTerms(true)}
          linkCount={links.length}
          boardCount={categories.length}
          isPro={isPro}
        />
      )}

      {/* ── Admin dashboard ────────────────────────────────────────────── */}
      {showAdmin && ['michcopski@gmail.com','admin@saveboard.app'].includes(user?.email ?? '') && (
        <AdminDashboard onClose={() => setShowAdmin(false)} userEmail={user.email} />
      )}
    </div>
  );
}
