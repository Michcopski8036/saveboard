import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../utils/translations';

export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; labelKey: TranslationKey | null; fallback: string }[] = [
  { value: 'newest', labelKey: 'newestFirst', fallback: 'Newest first' },
  { value: 'oldest', labelKey: 'oldestFirst', fallback: 'Oldest first' },
  { value: 'a-z', labelKey: null, fallback: 'A-Z' },
  { value: 'z-a', labelKey: null, fallback: 'Z-A' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { tr } = useLanguage();
  const labelOf = (o: typeof sortOptions[number]) => (o.labelKey ? tr(o.labelKey) : o.fallback);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = sortOptions.find(opt => opt.value === value);
  const currentLabel = currentOption ? labelOf(currentOption) : tr('sortLabel');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-[10px] hover:bg-gray-100 transition-colors text-sm"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700">{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-[10px] shadow-lg border border-gray-200 py-2 z-50">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="text-gray-700">{labelOf(option)}</span>
              {value === option.value && (
                <Check className="w-4 h-4 text-[#A259FF]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
