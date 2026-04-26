import { useState, useRef } from 'react';
import { ChevronDown, User, Settings, LogOut, Download, Upload } from 'lucide-react';

interface ProfileMenuProps {
  onExport?: () => void;
  onImport?: (data: any) => void;
}

export function ProfileMenu({ onExport, onImport }: ProfileMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      x: rect.right - 200,
      y: rect.bottom + 8,
    });
    setShowMenu(!showMenu);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    setShowMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          onImport(data);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
        />
        <ChevronDown className="w-4 h-4 text-gray-700" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Popup Menu */}
          <div
            className="fixed z-50 bg-white rounded-[10px] shadow-2xl w-[200px] overflow-hidden"
            style={{
              top: `${menuPosition.y}px`,
              left: `${menuPosition.x}px`,
            }}
          >
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <User className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Settings className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Settings</span>
              </button>
              <div className="border-t border-gray-200 my-2" />
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              >
                <Download className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Export links</span>
              </button>
              <button
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              >
                <Upload className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Import links</span>
              </button>
              <div className="border-t border-gray-200 my-2" />
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <LogOut className="w-4 h-4 text-gray-700" />
                <span className="text-sm">Log out</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </>
      )}
    </>
  );
}
