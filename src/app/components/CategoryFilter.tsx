import { useRef, useState, useEffect } from 'react';
import { ChevronRight, X, Plus } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onReorderCategories?: (categories: string[]) => void;
  onDeleteCategory?: (category: string) => void;
  onAddCategory?: (category: string) => void;
}

interface DraggableCategoryProps {
  category: string;
  index: number;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onDoubleClick: (category: string) => void;
  onMoveCategory: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd: () => void;
  onDelete?: (category: string) => void;
  editingCategory: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleRename: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

const ItemType = {
  CATEGORY: 'category',
};

function DraggableCategory({
  category,
  index,
  selectedCategory,
  onSelectCategory,
  onDoubleClick,
  onMoveCategory,
  onDragEnd,
  onDelete,
  editingCategory,
  editValue,
  setEditValue,
  handleRename,
  handleKeyDown,
}: DraggableCategoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType.CATEGORY,
    item: { index, category },
    canDrag: category !== 'All' && editingCategory !== category,
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType.CATEGORY,
    hover(item: { index: number; category: string }) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;
      if (category === 'All' || item.category === 'All') return;

      onMoveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Create custom drag preview
  useEffect(() => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    preview(img, { captureDraggingState: false });
  }, [preview]);

  drag(drop(ref));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(category);
    }
  };

  return (
    <div
      ref={ref}
      className={`relative ${isOver && !isDragging ? 'border-l-2 border-[#A259FF]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {editingCategory === category ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          autoFocus
          className="text-base whitespace-nowrap pb-2 border-b-2 border-[#A259FF] bg-transparent outline-none text-gray-900 min-w-[80px]"
        />
      ) : (
        <div className="relative inline-flex items-center gap-2">
          <button
            onClick={() => onSelectCategory(category)}
            onDoubleClick={() => onDoubleClick(category)}
            className={`text-base whitespace-nowrap pb-2 transition-all ${
              isDragging
                ? 'text-[#A259FF] border-b-2 border-[#A259FF] opacity-50'
                : selectedCategory === category
                ? 'text-gray-900 border-b-2 border-[#A259FF]'
                : isHovered && category !== 'All'
                ? 'text-gray-900 border-b-2 border-[#A259FF]'
                : 'text-gray-600 hover:text-gray-900'
            } ${category !== 'All' ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {category}
          </button>
          {isHovered && category !== 'All' && !isDragging && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-purple-100 rounded-full transition-colors mb-2"
              aria-label={`Delete ${category}`}
            >
              <X className="w-4 h-4 text-[#A259FF]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  onRenameCategory,
  onReorderCategories,
  onDeleteCategory,
  onAddCategory,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [localCategories]);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const moveCategory = (dragIndex: number, hoverIndex: number) => {
    const draggedCategory = localCategories[dragIndex];
    const newCategories = [...localCategories];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, draggedCategory);
    setLocalCategories(newCategories);
  };

  const handleDragEnd = () => {
    if (onReorderCategories) {
      // Remove "All" from the list when saving
      const reorderedCategories = localCategories.filter(cat => cat !== 'All');
      onReorderCategories(reorderedCategories);
    }
  };

  const handleDoubleClick = (category: string) => {
    // Don't allow renaming "All"
    if (category === 'All') return;

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

  const handleAddConfirm = () => {
    const trimmed = newCategoryValue.trim();
    if (trimmed && onAddCategory) {
      onAddCategory(trimmed);
    }
    setNewCategoryValue('');
    setIsAddingCategory(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddConfirm();
    else if (e.key === 'Escape') {
      setNewCategoryValue('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide flex-1">
          {localCategories.map((category, index) => (
            <DraggableCategory
              key={category}
              category={category}
              index={index}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onDoubleClick={handleDoubleClick}
              onMoveCategory={moveCategory}
              onDragEnd={handleDragEnd}
              onDelete={onDeleteCategory}
              editingCategory={editingCategory}
              editValue={editValue}
              setEditValue={setEditValue}
              handleRename={handleRename}
              handleKeyDown={handleKeyDown}
            />
          ))}
          {isAddingCategory && (
            <input
              type="text"
              value={newCategoryValue}
              onChange={(e) => setNewCategoryValue(e.target.value)}
              onBlur={handleAddConfirm}
              onKeyDown={handleAddKeyDown}
              autoFocus
              placeholder="Category name"
              className="text-base whitespace-nowrap pb-2 border-b-2 border-[#A259FF] bg-transparent outline-none text-gray-900 min-w-[100px]"
            />
          )}
        </div>
        {onAddCategory && (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-[10px] transition-colors"
            aria-label="Add category"
          >
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
        )}
        {isOverflowing && (
          <button
            onClick={scrollRight}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-[10px] transition-colors"
            aria-label="Scroll categories"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
  );
}
