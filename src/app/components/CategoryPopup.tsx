import { useState } from 'react';
import { Search, Plus, Lock } from 'lucide-react';

interface CategoryPopupProps {
  currentCategory: string;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  onAddCategory?: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  categories: string[];
  position: { x: number; y: number };
}

const categoryImages: Record<string, string> = {
  'Articles': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100',
  'Videos': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100',
  'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100',
  'Inspiration': 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=100',
  'Tools': 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=100',
};

export function CategoryPopup({ currentCategory, onClose, onSelectCategory, onAddCategory, onRenameCategory, categories, position }: CategoryPopupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categoriesWithImages = categories.map(name => ({
    name,
    image: categoryImages[name] || 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=100'
  }));

  const filteredCategories = categoriesWithImages.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allCategories = filteredCategories;

  const handleCategoryClick = (categoryName: string) => {
    onSelectCategory(categoryName);
    onClose();
  };

  const handleCreateBoard = () => {
    const trimmed = newBoardName.trim();
    if (trimmed && onAddCategory) {
      onAddCategory(trimmed);
      onSelectCategory(trimmed);
      onClose();
    }
  };

  const handleDoubleClick = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  };

  const handleRename = () => {
    if (editingCategory && editValue.trim() && editValue !== editingCategory && onRenameCategory) {
      onRenameCategory(editingCategory, editValue.trim());
    }
    setEditingCategory(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditingCategory(null);
      setEditValue('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed z-50 bg-white rounded-[10px] shadow-2xl w-[360px] max-h-[600px] overflow-hidden flex flex-col"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        <div className="p-4">
          <h2 className="text-center text-lg mb-4">Save to board</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
            />
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* All boards */}
          <div className="mb-2">
            <h3 className="text-xs mb-2">All boards</h3>
            {allCategories.map((category, index) => (
              <div
                key={`all-${category.name}-${index}`}
                onMouseEnter={() => setHoveredCategory(`all-${category.name}-${index}`)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-12 h-12 rounded-[10px] object-cover"
                />
                {editingCategory === category.name ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-base flex-1 text-left bg-transparent border-b-2 border-[#A259FF] outline-none px-1"
                  />
                ) : (
                  <span
                    className="text-base flex-1 text-left cursor-text"
                    onDoubleClick={() => handleDoubleClick(category.name)}
                  >
                    {category.name}
                  </span>
                )}
                {hoveredCategory === `all-${category.name}-${index}` && !editingCategory && (
                  <button
                    onClick={() => handleCategoryClick(category.name)}
                    className="px-5 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-full hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create board - Fixed at bottom */}
        <div className="shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          {isCreating ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBoard();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewBoardName('');
                  }
                }}
                placeholder="Board name"
                autoFocus
                className="flex-1 px-3 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
              />
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-[10px] flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-base">Create board</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
