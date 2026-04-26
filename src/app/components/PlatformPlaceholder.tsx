import { useState } from 'react';
import { Instagram, Youtube, Twitter, Link2 } from 'lucide-react';

interface PlatformPlaceholderProps {
  platform: 'instagram' | 'youtube' | 'twitter' | 'default';
  domain?: string;
  className?: string;
}

export function PlatformPlaceholder({ platform, domain, className = '' }: PlatformPlaceholderProps) {
  const [logoError, setLogoError] = useState(false);

  const getGradient = () => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]';
      case 'youtube':
        return 'bg-gradient-to-br from-[#FF0000] to-[#CC0000]';
      case 'twitter':
        return 'bg-gradient-to-br from-[#1DA1F2] to-[#0C85D0]';
      default:
        return 'bg-gradient-to-br from-[#A259FF] via-[#667eea] to-[#764ba2]';
    }
  };

  const getIcon = () => {
    const iconClass = "w-16 h-16 text-white opacity-80";
    switch (platform) {
      case 'instagram':
        return <Instagram className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
      default:
        return <Link2 className={iconClass} />;
    }
  };

  // Get site logo/favicon URL
  const getLogoUrl = () => {
    if (!domain || platform !== 'default') return null;

    // Use Google's favicon service for high-quality logos
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  const logoUrl = getLogoUrl();

  return (
    <div className={`${getGradient()} flex items-center justify-center ${className}`}>
      {logoUrl && !logoError ? (
        <img
          src={logoUrl}
          alt="Site logo"
          className="w-20 h-20 object-contain"
          onError={() => setLogoError(true)}
        />
      ) : (
        getIcon()
      )}
    </div>
  );
}

// Generate a placeholder data URL for use in LinkData
export function generatePlaceholderDataUrl(platform: 'instagram' | 'youtube' | 'twitter' | 'default'): string {
  // Return a special identifier that we can detect
  return `placeholder:${platform}`;
}

// Check if an image URL is a placeholder
export function isPlaceholder(imageUrl: string): boolean {
  return imageUrl.startsWith('placeholder:');
}

// Get platform from placeholder URL
export function getPlatformFromPlaceholder(imageUrl: string): 'instagram' | 'youtube' | 'twitter' | 'default' {
  if (!isPlaceholder(imageUrl)) return 'default';
  const platform = imageUrl.replace('placeholder:', '');
  return platform as 'instagram' | 'youtube' | 'twitter' | 'default';
}
