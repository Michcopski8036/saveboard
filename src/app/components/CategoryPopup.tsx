import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

interface CategoryPopupProps {
  currentCategory: string;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  onAddCategory?: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  categories: string[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #A259FF, #FF7262)',
  'linear-gradient(135deg, #1ABCFE, #0E8FD8)',
  'linear-gradient(135deg, #FF7262, #FF9F4A)',
  'linear-gradient(135deg, #0ACF83, #00A86B)',
  'linear-gradient(135deg, #F7C948, #F5A623)',
  'linear-gradient(135deg, #6C5CE7, #a29bfe)',
  'linear-gradient(135deg, #fd79a8, #e84393)',
  'linear-gradient(135deg, #00b894, #00cec9)',
];

function avatarGradient(name: string): string {
  const idx = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function CategoryAvatar({ name }: { name: string }) {
  return (
    <div
      className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
      style={{ background: avatarGradient(name) }}
    >
      <span className="text-white font-semibold text-base select-none">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export function CategoryPopup({ currentCategory, onClose, onSelectCategory, onAddCategory, onRenameCategory, categories }: CategoryPopupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredCategories = categories.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (name: string) => {
    onSelectCategory(name);
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
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') { setEditingCategory(null); setEditValue(''); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      <div
        className="fixed z-50 bg-white rounded-[10px] shadow-2xl w-[360px] max-w-[90vw] max-h-[600px] overflow-hidden flex flex-col"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <h2 className="text-center text-lg mb-4">Change Board</h2>
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

        <div className="flex-1 overflow-y-auto px-4">
          <div className="mb-2">
            <h3 className="text-xs text-gray-400 mb-2">All boards</h3>
            {filteredCategories.map((name, index) => (
              <div
                key={`${name}-${index}`}
                onMouseEnter={() => setHoveredCategory(`${name}-${index}`)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              >
                <CategoryAvatar name={name} />
                {editingCategory === name ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-base flex-1 bg-transparent border-b-2 border-[#A259FF] outline-none px-1"
                  />
                ) : (
                  <span
                    className="text-base flex-1 text-left cursor-text"
                    onDoubleClick={() => handleDoubleClick(name)}
                  >
                    {name}
                  </span>
                )}
                {hoveredCategory === `${name}-${index}` && !editingCategory && (
                  <button
                    onClick={() => handleCategoryClick(name)}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                  >
                    Select
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          {isCreating ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBoard();
                  if (e.key === 'Escape') { setIsCreating(false); setNewBoardName(''); }
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
              <div className="w-10 h-10 bg-gray-100 rounded-[10px] flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-base text-gray-700">Create board</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
