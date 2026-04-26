import { useState, useRef } from 'react';
import { ChevronDown, LogOut, Download, Upload } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileMenuProps {
  onExport?: () => void;
  onImport?: (data: any) => void;
  onSignOut?: () => void;
  user?: SupabaseUser | null;
}

export function ProfileMenu({ onExport, onImport, onSignOut, user }: ProfileMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ x: rect.right - 220, y: rect.bottom + 8 });
    setShowMenu(!showMenu);
  };

  const handleExport = () => { if (onExport) onExport(); setShowMenu(false); };
  const handleImportClick = () => { fileInputRef.current?.click(); setShowMenu(false); };
  const handleSignOut = () => { if (onSignOut) onSignOut(); setShowMenu(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          onImport(data);
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const email = user?.email || '';
  const initials = email.charAt(0).toUpperCase();

  return (
    <>
      <button onClick={handleProfileClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A259FF] to-[#FF7262] flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <ChevronDown className="w-4 h-4 text-gray-700" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            className="fixed z-50 bg-white rounded-[10px] shadow-2xl w-[220px] overflow-hidden"
            style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          >
            <div className="p-2">
              {email && (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
              )}
              <div className="border-t border-gray-200 my-1" />
              <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Download className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Export links</span>
              </button>
              <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Upload className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Import links</span>
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-red-500">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Log out</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </div>
        </>
      )}
    </>
  );
}