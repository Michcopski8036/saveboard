import { useState, useEffect } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { LinkCard, LinkData } from './components/LinkCard';
import { CategoryFilter } from './components/CategoryFilter';
import { ProfileMenu } from './components/ProfileMenu';
import { SearchBar } from './components/SearchBar';
import { SortDropdown, SortOption } from './components/SortDropdown';
import { Plus, Bookmark, CheckSquare, Trash2 } from 'lucide-react';
import {
  getLinks,
  saveLinks,
  getCategories,
  saveCategories,
  migrateFromLocalStorage,
  needsMigration,
  type Link
} from './utils/db';

// Mock data with real public content
const mockLinks: LinkData[] = [
  {
    id: '1',
    url: 'https://www.smashingmagazine.com/articles/',
    title: 'Web Design Best Practices and Trends',
    description: 'Latest articles on modern web design and development',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
    category: 'Articles',
    savedAt: new Date('2026-04-20'),
  },
  {
    id: '2',
    url: 'https://www.youtube.com/@Fireship',
    title: 'Fireship - Web Development Tutorials',
    description: 'Fast-paced coding tutorials and tech news',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    category: 'Videos',
    savedAt: new Date('2026-04-19'),
  },
  {
    id: '3',
    url: 'https://dribbble.com/tags/ui-design',
    title: 'UI Design Inspiration on Dribbble',
    description: 'Beautiful interface designs from top designers',
    image: 'https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800&q=80',
    category: 'Design',
    savedAt: new Date('2026-04-18'),
  },
  {
    id: '4',
    url: 'https://react.dev/blog',
    title: 'React Official Blog',
    description: 'Latest updates and announcements from React team',
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80',
    category: 'Articles',
    savedAt: new Date('2026-04-17'),
  },
  {
    id: '5',
    url: 'https://www.awwwards.com/websites/',
    title: 'Award-Winning Website Designs',
    description: 'The best web design inspiration from around the world',
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80',
    category: 'Inspiration',
    savedAt: new Date('2026-04-16'),
  },
  {
    id: '6',
    url: 'https://github.com/explore',
    title: 'GitHub Explore - Trending Repositories',
    description: 'Discover trending open source projects',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80',
    category: 'Tools',
    savedAt: new Date('2026-04-15'),
  },
  {
    id: '7',
    url: 'https://www.youtube.com/@TraversyMedia',
    title: 'Traversy Media - Web Dev Tutorials',
    description: 'Practical web development courses and tutorials',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80',
    category: 'Videos',
    savedAt: new Date('2026-04-14'),
  },
  {
    id: '8',
    url: 'https://www.figma.com/community',
    title: 'Figma Community Resources',
    description: 'Free design resources, plugins, and templates',
    image: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&q=80',
    category: 'Design',
    savedAt: new Date('2026-04-13'),
  },
  {
    id: '9',
    url: 'https://www.youtube.com/shorts/jvP2cXsFi6U',
    title: 'YouTube Short - Quick Tutorial',
    description: 'Engaging short-form video content',
    image: 'https://img.youtube.com/vi/jvP2cXsFi6U/maxresdefault.jpg',
    category: 'Videos',
    savedAt: new Date('2026-04-12'),
  },
  {
    id: '10',
    url: 'https://youtu.be/OkastNP9SUE?si=X-0r60b5ZFTefL50',
    title: 'YouTube Video Tutorial',
    description: 'Full-length video tutorial content',
    image: 'https://img.youtube.com/vi/OkastNP9SUE/maxresdefault.jpg',
    category: 'Videos',
    savedAt: new Date('2026-04-11'),
  },
];

const defaultCategories = ['Articles', 'Videos', 'Design', 'Inspiration', 'Tools'];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB on mount with migration
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if migration is needed
        if (needsMigration()) {
          await migrateFromLocalStorage();
        }

        // Load links
        const loadedLinks = await getLinks();
        if (loadedLinks.length > 0) {
          // Convert createdAt numbers back to Date objects for savedAt
          const linksWithDates = loadedLinks.map((link: Link) => ({
            ...link,
            savedAt: new Date(link.createdAt)
          }));
          setLinks(linksWithDates);
        } else {
          // No links found, use mock data
          setLinks(mockLinks);
          await saveLinks(mockLinks.map(link => ({
            ...link,
            createdAt: link.savedAt.getTime()
          })));
        }

        // Load categories
        const loadedCategories = await getCategories();
        if (loadedCategories.length > 0) {
          setCategories(loadedCategories);
        } else {
          // No categories found, use defaults
          setCategories(defaultCategories);
          await saveCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error loading data from IndexedDB:', error);
        // Fallback to mock data
        setLinks(mockLinks);
        setCategories(defaultCategories);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save to IndexedDB whenever links change
  useEffect(() => {
    if (!isLoading && links.length > 0) {
      saveLinks(links.map(link => ({
        ...link,
        createdAt: link.savedAt.getTime()
      }))).catch(error => {
        console.error('Error saving links to IndexedDB:', error);
        setErrorMessage('Failed to save links. Storage may be full.');
      });
    }
  }, [links, isLoading]);

  // Save to IndexedDB whenever categories change
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      saveCategories(categories).catch(error => {
        console.error('Error saving categories to IndexedDB:', error);
      });
    }
  }, [categories, isLoading]);

  // Filter by category
  let filteredLinks = selectedCategory === 'All'
    ? links
    : links.filter((link) => link.category === selectedCategory);

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredLinks = filteredLinks.filter((link) =>
      link.title.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    );
  }

  // Sort links
  filteredLinks = [...filteredLinks].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return b.savedAt.getTime() - a.savedAt.getTime();
      case 'oldest':
        return a.savedAt.getTime() - b.savedAt.getTime();
      case 'a-z':
        return a.title.localeCompare(b.title);
      case 'z-a':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const handleAddUrl = async () => {
    const input = urlInput.trim();
    if (!input) return;

    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    setIsAdding(true);

    try {
      // Import utilities
      const { fetchMetadata, generateId } = await import('./utils/metadataFetcher');
      const { parseEmbedCode } = await import('./utils/embedParser');

      let url = input;
      let metadata;

      // Check if input is an embed code
      const embedData = parseEmbedCode(input);
      if (embedData) {
        // It's an embed code - use extracted data
        url = embedData.url;
        metadata = {
          title: embedData.title || 'Embedded Content',
          description: embedData.description || 'Content from embed code',
          image: embedData.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80'
        };
      } else {
        // It's a regular URL - validate it
        try {
          new URL(url);
        } catch {
          setErrorMessage('Please enter a valid URL or embed code');
          setIsAdding(false);
          return;
        }

        // Check for duplicates
        const isDuplicate = links.some(link => link.url === url);
        if (isDuplicate) {
          setErrorMessage('This URL has already been saved');
          setIsAdding(false);
          return;
        }

        // Fetch metadata
        metadata = await fetchMetadata(url);
      }

      // Create new link - ensure metadata has values
      const urlObj = new URL(url);
      const newLink: LinkData = {
        id: generateId(),
        url: url,
        title: metadata.title || 'Web Page',
        description: metadata.description || urlObj.hostname.replace('www.', ''),
        image: metadata.image || 'placeholder:default',
        category: 'Articles', // Default category
        savedAt: new Date()
      };

      // Add to links
      setLinks((prevLinks) => [newLink, ...prevLinks]);
      setUrlInput('');
      setSuccessMessage('Link added successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error adding URL
      setErrorMessage('Failed to fetch link details. Please try again.');

      // Even if there's an error, try to save the link with basic info
      try {
        const urlObj = new URL(url);
        const basicLink: LinkData = {
          id: Date.now().toString(),
          url: url,
          title: urlObj.hostname.replace('www.', ''),
          description: `Saved from ${urlObj.hostname}`,
          image: 'placeholder:default',
          category: 'Articles',
          savedAt: new Date()
        };

        setLinks((prevLinks) => [basicLink, ...prevLinks]);
        setUrlInput('');
        setSuccessMessage('Link saved with basic information');

        // Clear message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 3000);
      } catch (fallbackError) {
        setErrorMessage('Failed to add URL. Please check the URL and try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCategory = (linkId: string, newCategory: string) => {
    setLinks((prevLinks) =>
      prevLinks.map((link) =>
        link.id === linkId ? { ...link, category: newCategory } : link
      )
    );
  };

  const handleDeleteLink = (linkId: string) => {
    setLinks((prevLinks) => prevLinks.filter((link) => link.id !== linkId));
  };

  const handleUpdateNotes = (linkId: string, notes: string) => {
    setLinks((prevLinks) =>
      prevLinks.map((link) =>
        link.id === linkId ? { ...link, notes } : link
      )
    );
  };

  const handleAddCategory = (newCategory: string) => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();

    // Check if new name already exists
    if (categories.includes(trimmed)) {
      alert('A category with this name already exists');
      return;
    }

    // Update category list
    setCategories((prev) => prev.map((cat) => (cat === oldName ? trimmed : cat)));

    // Update all links using this category
    setLinks((prevLinks) =>
      prevLinks.map((link) =>
        link.category === oldName ? { ...link, category: trimmed } : link
      )
    );

    // Update selected category if needed
    if (selectedCategory === oldName) {
      setSelectedCategory(trimmed);
    }
  };

  const handleReorderCategories = (reorderedCategories: string[]) => {
    setCategories(reorderedCategories);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    // Check if any links use this category
    const linksUsingCategory = links.filter((link) => link.category === categoryToDelete);

    if (linksUsingCategory.length > 0) {
      const confirmed = confirm(
        `${linksUsingCategory.length} link(s) use this category. They will be moved to "Articles". Continue?`
      );
      if (!confirmed) return;

      // Move links to default category
      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link.category === categoryToDelete ? { ...link, category: 'Articles' } : link
        )
      );
    }

    setCategories((prev) => prev.filter((cat) => cat !== categoryToDelete));

    // If deleted category was selected, switch to All
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }
  };

  const handleExport = () => {
    const data = {
      links,
      categories,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (data: any) => {
    if (!data.links || !Array.isArray(data.links)) {
      alert('Invalid data format');
      return;
    }

    const confirmed = confirm(
      `Import ${data.links.length} link(s)? This will replace your current links.`
    );

    if (!confirmed) return;

    try {
      // Parse dates
      const importedLinks = data.links.map((link: any) => ({
        ...link,
        savedAt: new Date(link.savedAt),
      }));

      setLinks(importedLinks);

      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }

      // Save to IndexedDB
      await saveLinks(importedLinks.map(link => ({
        ...link,
        createdAt: link.savedAt.getTime()
      })));

      if (data.categories && Array.isArray(data.categories)) {
        await saveCategories(data.categories);
      }

      alert('Import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    }
  };

  const handleToggleSelect = (linkId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    const confirmed = confirm(`Delete ${selectedIds.size} selected link(s)?`);
    if (!confirmed) return;

    setLinks((prevLinks) => prevLinks.filter((link) => !selectedIds.has(link.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#A259FF] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading LinkBoard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
            <ProfileMenu onExport={handleExport} onImport={handleImport} />
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAdding && handleAddUrl()}
                placeholder="Paste URL or embed code (Instagram, YouTube, etc.)..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent"
              />
              <button
                onClick={handleAddUrl}
                disabled={isAdding || !urlInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : 'Add'}
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-[10px] flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-[10px] flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {isAdding && (
              <p className="text-xs text-gray-500 mt-2">
                Fetching link details...
              </p>
            )}
          </div>

          <CategoryFilter
            categories={['All', ...categories]}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onRenameCategory={handleRenameCategory}
            onReorderCategories={handleReorderCategories}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 0: 1, 350: 2, 768: 3, 1024: 4, 1280: 5 }}
        >
          <Masonry gutter="16px">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
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
      </main>

      {/* Bulk Actions Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-[10px] shadow-2xl px-6 py-4 flex items-center gap-4">
            <span className="text-sm">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF7262] rounded-[10px] hover:opacity-90 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}