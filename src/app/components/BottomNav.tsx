import { Home, Search, Plus, Heart, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { Collection } from './Sidebar';

interface BottomNavProps {
  selected: Collection;
  onSelect: (id: Collection) => void;
  onOpenAdd: () => void;
  onFocusSearch: () => void;
  onOpenMore: () => void;
  favorites: Set<string>;
  hidden?: boolean;
}

export function BottomNav({ selected, onSelect, onOpenAdd, onFocusSearch, onOpenMore, favorites, hidden }: BottomNavProps) {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const accent = '#7C3AED';

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex flex-col"
      style={{
        background: t.bottomNavBg,
        borderTop: `1px solid ${t.bottomNavBorder}`,
        boxShadow: t.bottomNavShadow,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transform: hidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
      {/* 48px matches the ~49pt content height of a native iOS tab bar. With the
          safe-area spacer below it the whole bar comes to ~82pt, the same as the
          system one — at h-16 it was 98pt and visibly taller than other apps. */}
      <div className="flex items-stretch h-12">

        {/* Home */}
        <button
          className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-opacity active:opacity-60"
          style={{ color: selected === 'all' ? accent : t.bottomNavInactiveText }}
          onClick={() => onSelect('all')}>
          <Home className={`w-[22px] h-[22px] transition-transform ${selected === 'all' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-semibold tracking-wide">{tr('home')}</span>
        </button>

        {/* Search */}
        <button
          className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-opacity active:opacity-60"
          style={{ color: t.bottomNavInactiveText }}
          onClick={onFocusSearch}>
          <Search className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-semibold tracking-wide">{tr('searchNav')}</span>
        </button>

        {/* Add (center, elevated) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onOpenAdd}
            className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center text-white transition-transform active:scale-95"
            style={{
              background: t.accentBg,
              boxShadow: t.accentShadow,
            }}>
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Saved */}
        <button
          className="flex-1 flex flex-col items-center justify-center gap-[3px] relative transition-opacity active:opacity-60"
          style={{ color: selected === 'favorites' ? accent : t.bottomNavInactiveText }}
          onClick={() => onSelect('favorites')}>
          <Heart
            className={`w-[22px] h-[22px] transition-all ${selected === 'favorites' ? 'fill-[#7C3AED] scale-110' : ''}`}
          />
          <span className="text-[9px] font-semibold tracking-wide">{tr('savedNav')}</span>
          {favorites.size > 0 && (
            <span
              className="absolute top-1.5 right-[14%] h-4 min-w-[16px] rounded-full text-[8px] font-bold flex items-center justify-center text-white px-1"
              style={{ background: '#EF4444' }}>
              {favorites.size > 9 ? '9+' : favorites.size}
            </span>
          )}
        </button>

        {/* More */}
        <button
          className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-opacity active:opacity-60"
          style={{ color: t.bottomNavInactiveText }}
          onClick={onOpenMore}>
          <MoreHorizontal className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-semibold tracking-wide">{tr('moreNav')}</span>
        </button>
      </div>

      {/* iOS safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
