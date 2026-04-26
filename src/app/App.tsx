import { useState, useEffect, useRef } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { LinkCard, LinkData } from './components/LinkCard';
import { CategoryFilter } from './components/CategoryFilter';
import { ProfileMenu } from './components/ProfileMenu';
import { SortDropdown, SortOption } from './components/SortDropdown';
import { Auth } from './components/Auth';
import { Bookmark, Trash2, Paperclip } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

const defaultCategories = ['Articles', 'Videos', 'Design', 'Inspiration', 'Tools'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setLinks([]); setCategories(defaultCategories); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: linksData } = await supabase.from('links').select('*').order('created_at', { ascending: false });
      if (linksData && linksData.length > 0) {
        setLinks(linksData.map(l => ({ ...l, savedAt: new Date(l.created_at) })));
      }
      const { data: catsData } = await supabase.from('categories').select('name').order('created_at', { ascending: true });
      if (catsData && catsData.length > 0) {
        setCategories(catsData.map(c => c.name));
      } else {
        await supabase.from('categories').insert(defaultCategories.map(name => ({ name, user_id: user!.id })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  let filteredLinks = selectedCategory === 'All' ? links : links.filter(l => l.category === selectedCategory);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredLinks = filteredLinks.filter(l =>
      l.title.toLowerCase().includes(query) ||
      l.description.toLowerCase().includes(query) ||
      l.url.toLowerCase().includes(query)
    );
  }
  filteredLinks = [...filteredLinks].sort((a, b) => {
    switch (sortOption) {
      case 'newest': return b.savedAt.getTime() - a.savedAt.getTime();
      case 'oldest': return a.savedAt.getTime() - b.savedAt.getTime();
      case 'a-z': return a.title.localeCompare(b.title);
      case 'z-a': return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  const handleAddUrl = async () => {
    const input = urlInput.trim();
    if (!input || !user) return;
    setErrorMessage(''); setSuccessMessage(''); setIsAdding(true);
    try {
      const { fetchMetadata, generateId } = await import('./utils/metadataFetcher');
      const { parseEmbedCode } = await import('./utils/embedParser');

      // Embed code
      const embedData = parseEmbedCode(input);
      if (embedData) {
        const url = embedData.url;
        const newLink = {
          id: generateId(), user_id: user.id, url,
          title: embedData.title || 'Embedded Content',
          description: embedData.description || 'Content from embed code',
          image: embedData.image || 'placeholder:default',
          category: 'None', created_at: Date.now(),
        };
        const { error } = await supabase.from('links').insert(newLink);
        if (error) throw error;
        setLinks(prev => [{ ...newLink, savedAt: new Date(newLink.created_at) }, ...prev]);
        setUrlInput('');
        setSuccessMessage('Link added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      // Memo: not a URL
      const looksLikeUrl = /^https?:\/\//i.test(input) || /^www\./i.test(input);
      let isValidUrl = false;
      if (looksLikeUrl) {
        try { new URL(input.startsWith('www.') ? 'https://' + input : input); isValidUrl = true; } catch { /* */ }
      }

      if (!isValidUrl) {
        const newLink = {
          id: generateId(), user_id: user.id,
          url: '#',
          title: input.slice(0, 50),
          description: input,
          image: 'placeholder:memo',
          category: 'None', created_at: Date.now(),
        };
        const { error } = await supabase.from('links').insert(newLink);
        if (error) throw error;
        setLinks(prev => [{ ...newLink, savedAt: new Date(newLink.created_at) }, ...prev]);
        setUrlInput('');
        setSuccessMessage('Memo saved!');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      // Regular URL
      const url = input.startsWith('www.') ? 'https://' + input : input;
      if (links.some(l => l.url === url)) { setErrorMessage('This URL has already been saved'); return; }
      const metadata = await fetchMetadata(url);
      const urlObj = new URL(url);
      const newLink = {
        id: generateId(), user_id: user.id, url,
        title: metadata.title || 'Web Page',
        description: metadata.description || urlObj.hostname.replace('www.', ''),
        image: metadata.image || 'placeholder:default',
        category: 'None', created_at: Date.now(),
      };
      const { error } = await supabase.from('links').insert(newLink);
      if (error) throw error;
      setLinks(prev => [{ ...newLink, savedAt: new Date(newLink.created_at) }, ...prev]);
      setUrlInput('');
      setSuccessMessage('Link added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch { setErrorMessage('Failed to add link. Please try again.'); }
    finally { setIsAdding(false); }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== 'application/pdf') { setErrorMessage('Only PDF files are supported'); return; }
    setErrorMessage(''); setSuccessMessage(''); setIsAdding(true);
    try {
      const { generateId } = await import('./utils/metadataFetcher');
      const fileId = generateId();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${fileId}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('pdfs').upload(path, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path);
      const newLink = {
        id: fileId, user_id: user.id,
        url: publicUrl,
        title: file.name.replace(/\.pdf$/i, ''),
        description: `PDF • ${(file.size / 1024).toFixed(0)} KB`,
        image: 'placeholder:pdf',
        category: 'None', created_at: Date.now(),
      };
      const { error } = await supabase.from('links').insert(newLink);
      if (error) throw error;
      setLinks(prev => [{ ...newLink, savedAt: new Date(newLink.created_at) }, ...prev]);
      setSuccessMessage('PDF uploaded!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(
        err?.message?.toLowerCase().includes('bucket')
          ? 'Create a "pdfs" bucket in Supabase Storage first'
          : 'Failed to upload PDF'
      );
    } finally {
      setIsAdding(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateCategory = async (linkId: string, newCategory: string) => {
    await supabase.from('links').update({ category: newCategory }).eq('id', linkId);
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, category: newCategory } : l));
  };

  const handleDeleteLink = async (linkId: string) => {
    await supabase.from('links').delete().eq('id', linkId);
    setLinks(prev => prev.filter(l => l.id !== linkId));
  };

  const handleUpdateNotes = async (linkId: string, notes: string) => {
    await supabase.from('links').update({ notes }).eq('id', linkId);
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, notes } : l));
  };

  const handleAddCategory = async (newCategory: string) => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      await supabase.from('categories').insert({ name: trimmed, user_id: user!.id });
      setCategories(prev => [...prev, trimmed]);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (categories.includes(trimmed)) { alert('A category with this name already exists'); return; }
    await supabase.from('categories').update({ name: trimmed }).eq('name', oldName).eq('user_id', user!.id);
    await supabase.from('links').update({ category: trimmed }).eq('category', oldName).eq('user_id', user!.id);
    setCategories(prev => prev.map(c => c === oldName ? trimmed : c));
    setLinks(prev => prev.map(l => l.category === oldName ? { ...l, category: trimmed } : l));
    if (selectedCategory === oldName) setSelectedCategory(trimmed);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const linksUsing = links.filter(l => l.category === categoryToDelete);
    if (linksUsing.length > 0) {
      if (!confirm(`${linksUsing.length} link(s) will be moved to "Articles". Continue?`)) return;
      await supabase.from('links').update({ category: 'Articles' }).eq('category', categoryToDelete).eq('user_id', user!.id);
      setLinks(prev => prev.map(l => l.category === categoryToDelete ? { ...l, category: 'Articles' } : l));
    }
    await supabase.from('categories').delete().eq('name', categoryToDelete).eq('user_id', user!.id);
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
    if (selectedCategory === categoryToDelete) setSelectedCategory('All');
  };

  const handleReorderCategories = (reorderedCategories: string[]) => setCategories(reorderedCategories);

  const handleExport = () => {
    const data = { links, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `linkboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImport = async (data: any) => {
    if (!data.links || !Array.isArray(data.links)) { alert('Invalid data format'); return; }
    if (!confirm(`Import ${data.links.length} link(s)?`)) return;
    await supabase.from('links').delete().eq('user_id', user!.id);
    const importedLinks = data.links.map((l: any) => ({ ...l, user_id: user!.id, savedAt: undefined, created_at: new Date(l.savedAt).getTime() }));
    await supabase.from('links').insert(importedLinks);
    setLinks(importedLinks.map((l: any) => ({ ...l, savedAt: new Date(l.created_at) })));
    alert('Import successful!');
  };

  const handleToggleSelect = (linkId: string) => {
    setSelectedIds(prev => { const s = new Set(prev); s.has(linkId) ? s.delete(linkId) : s.add(linkId); return s; });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} link(s)?`)) return;
    await supabase.from('links').delete().in('id', Array.from(selectedIds));
    setLinks(prev => prev.filter(l => !selectedIds.has(l.id)));
    setSelectedIds(new Set()); setSelectMode(false);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <svg className="animate-spin h-12 w-12 text-[#A259FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E] rounded-[10px]">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Link<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
              </h1>
            </div>
            <ProfileMenu onExport={handleExport} onImport={handleImport} onSignOut={handleSignOut} user={user} />
          </div>
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text" value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAdding && handleAddUrl()}
                placeholder="Paste a URL, or type a note..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent"
              />
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isAdding}
                className="px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[10px] transition-colors disabled:opacity-50"
                title="Upload PDF">
                <Paperclip className="w-5 h-5" />
              </button>
              <button onClick={handleAddUrl} disabled={isAdding || !urlInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
            {errorMessage && <p className="mt-2 text-sm text-red-500">{errorMessage}</p>}
            {successMessage && <p className="mt-2 text-sm text-green-500">{successMessage}</p>}
          </div>
          <CategoryFilter
            categories={['All', ...categories]}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onRenameCategory={handleRenameCategory}
            onReorderCategories={handleReorderCategories}
            onDeleteCategory={handleDeleteCategory}
            onAddCategory={handleAddCategory}
          />
        </div>
      </header>
      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-[#A259FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 350: 2, 768: 3, 1024: 4, 1280: 5 }}>
            <Masonry gutter="16px">
              {filteredLinks.map((link) => (
                <LinkCard
                  key={link.id} link={link}
                  onUpdateCategory={handleUpdateCategory}
                  onDelete={handleDeleteLink}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onUpdateNotes={handleUpdateNotes}
                  onToggleSelect={handleToggleSelect}
                  categories={categories}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(link.id)}
                />
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </main>
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-[10px] shadow-2xl px-6 py-4 flex items-center gap-4">
            <span className="text-sm">{selectedIds.size} selected</span>
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF7262] rounded-[10px]">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}