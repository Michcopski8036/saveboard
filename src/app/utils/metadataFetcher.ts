// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Extract Vimeo video ID from URL
function extractVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return match ? match[1] : null;
}

// Fetch Vimeo thumbnail and metadata via oEmbed
async function fetchVimeoMetadata(url: string): Promise<{ title: string; description: string; image: string } | null> {
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || 'Vimeo Video',
      description: data.description || `Video by ${data.author_name || 'Vimeo user'}`,
      image: data.thumbnail_url || 'placeholder:default',
    };
  } catch {
    return null;
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Fetch Open Graph metadata from a URL
export async function fetchMetadata(url: string): Promise<{
  title: string;
  description: string;
  image: string;
  comments?: string[];
}> {
  // Parse URL to get hostname
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  const isInstagram = hostname.includes('instagram.com');
  const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
  const isVimeo = hostname.includes('vimeo.com');

  // Default fallback metadata
  const fallbackMetadata = {
    title: hostname,
    description: `Link saved from ${hostname}`,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80'
  };

  try {

    // YouTube: guarantee thumbnail from video ID, try Microlink only for title
    if (isYouTube) {
      const videoId = extractYouTubeVideoId(url);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'placeholder:youtube';
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data?.title) {
            return { title: data.data.title, description: data.data.description || '', image: thumbnail };
          }
        }
      } catch { /* use fallback below */ }
      return { title: 'YouTube Video', description: 'View this video on YouTube', image: thumbnail };
    }

    // Vimeo: use oEmbed API for thumbnail + metadata
    if (isVimeo) {
      const vimeoMeta = await fetchVimeoMetadata(url);
      if (vimeoMeta) return vimeoMeta;
      const videoId = extractVimeoVideoId(url);
      return {
        title: 'Vimeo Video',
        description: 'View this video on Vimeo',
        image: videoId ? `https://vumbnail.com/${videoId}.jpg` : 'placeholder:default',
      };
    }

    // For Instagram, try to use their oEmbed API first
    if (isInstagram) {
      try {
        const oembedUrl = `https://graph.instagram.com/oembed?url=${encodeURIComponent(url)}&access_token=OPTIONAL`;
        const oembedResponse = await fetch(oembedUrl);

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          if (oembedData.thumbnail_url || oembedData.title) {
            return {
              title: oembedData.title || oembedData.author_name || fallbackMetadata.title,
              description: `Instagram post by ${oembedData.author_name || 'user'}`,
              image: oembedData.thumbnail_url || fallbackMetadata.image
            };
          }
        }
      } catch (error) {
        // Instagram oEmbed failed, continue to other methods
      }
    }

    // Try metadata API service first (works better than proxies)
    try {
      const fetchWithRetry = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Microlink API returned ${response.status}`);
        }

        return response.json();
      };

      const data = await retryWithBackoff(fetchWithRetry, 2, 1000);

      if (data.status === 'success' && data.data) {
        const metadata = data.data;

        // For YouTube, always use thumbnail from video ID
        let imageUrl;
        if (isYouTube) {
          const videoId = extractYouTubeVideoId(url);
          imageUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : metadata.image?.url;
        } else {
          imageUrl = metadata.image?.url;
        }

        if (!imageUrl) {
          imageUrl = fallbackMetadata.image;
        } else if (!imageUrl.startsWith('https://images.unsplash.com') && !imageUrl.startsWith('https://img.youtube.com')) {
          // Proxy through images.weserv.nl for CORS support
          imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&q=80`;
        }

        return {
          title: metadata.title || fallbackMetadata.title,
          description: metadata.description || fallbackMetadata.description,
          image: imageUrl
        };
      }
    } catch (error) {
      // Microlink failed after retries, continue to fallback methods
    }

    // Fallback to CORS proxies
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

    let html = '';
    let fetchSuccess = false;

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          html = await response.text();
          fetchSuccess = true;
          break;
        }
      } catch (error) {
        continue; // Try next proxy
      }
    }

    if (!fetchSuccess || !html) {
      // Return smart fallback instead of throwing error
      const smartTitle = getSmartTitle(url);
      return {
        title: smartTitle,
        description: hostname,
        image: getDefaultImageForDomain(hostname, url)
      };
    }

    // Parse HTML to extract OG tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract Open Graph metadata
    const getMetaContent = (property: string): string => {
      const meta = doc.querySelector(`meta[property="${property}"]`) ||
                    doc.querySelector(`meta[name="${property}"]`);
      return meta?.getAttribute('content') || '';
    };

    // Get title
    let title = getMetaContent('og:title') ||
                getMetaContent('twitter:title') ||
                doc.querySelector('title')?.textContent ||
                fallbackMetadata.title;

    // Get description
    let description = getMetaContent('og:description') ||
                      getMetaContent('twitter:description') ||
                      getMetaContent('description') ||
                      fallbackMetadata.description;

    // Get image
    let image = getMetaContent('og:image') ||
                getMetaContent('twitter:image') ||
                fallbackMetadata.image;

    // Make relative URLs absolute
    if (image && !image.startsWith('http')) {
      image = new URL(image, urlObj.origin).href;
    }

    // Only use placeholder if we truly couldn't get any metadata
    const hasRealData = title.trim() || description.trim() || image;

    return {
      title: title.trim() || fallbackMetadata.title,
      description: description.trim() || fallbackMetadata.description,
      image: image || (hasRealData ? getDefaultImageForDomain(hostname, url) : 'placeholder:default')
    };
  } catch (error) {
    // Metadata fetch failed, using fallback

    // Special handling for Instagram
    if (isInstagram) {
      return {
        title: 'Instagram Post',
        description: 'View this post on Instagram - Click to open the original post',
        image: 'placeholder:instagram'
      };
    }

    // Special handling for YouTube - extract video ID and use thumbnail
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      return {
        title: 'YouTube Video',
        description: 'View this video on YouTube',
        image: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'placeholder:youtube'
      };
    }

    // Special handling for Twitter
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return {
        title: 'Twitter Post',
        description: 'View this post on Twitter/X',
        image: 'placeholder:twitter'
      };
    }

    // Return enhanced fallback with smart defaults based on URL
    const smartTitle = getSmartTitle(url);
    return {
      title: smartTitle,
      description: hostname,
      image: 'placeholder:default'
    };
  }
}

// Generate a smart title from URL
function getSmartTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;

    // Special handling for Seek job URLs
    if (hostname.includes('seek.com')) {
      return 'Job Listing - SEEK';
    }

    // Try to get a title from the path
    if (path && path !== '/' && path !== '') {
      const pathParts = path.split('/').filter(p => p);
      if (pathParts.length > 0) {
        // Get the last meaningful part of the path
        let lastPart = pathParts[pathParts.length - 1];

        // Remove file extensions
        lastPart = lastPart.replace(/\.[^.]+$/, '');

        // Remove common separators and IDs
        lastPart = lastPart.replace(/[_-]/g, ' ');

        // Don't use if it looks like an ID or is too short
        if (lastPart.length > 3 && !/^[0-9]+$/.test(lastPart)) {
          // Convert to Title Case
          const title = lastPart
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          return title;
        }
      }
    }

    // Just use a generic "Web Page" title
    return 'Web Page';
  } catch {
    return 'Saved Link';
  }
}

// Get a default image based on known domains
function getDefaultImageForDomain(hostname: string, url?: string): string {
  // For YouTube, try to extract video ID and use thumbnail
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    if (url) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    return 'placeholder:youtube';
  }

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'placeholder:twitter';
  }

  if (hostname.includes('instagram.com')) {
    return 'placeholder:instagram';
  }

  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
    return 'placeholder:facebook';
  }

  if (hostname.includes('tiktok.com')) {
    return 'placeholder:tiktok';
  }

  if (hostname.includes('linkedin.com')) {
    return 'placeholder:linkedin';
  }

  if (hostname.includes('vimeo.com')) {
    if (url) {
      const videoId = extractVimeoVideoId(url);
      if (videoId) return `https://vumbnail.com/${videoId}.jpg`;
    }
    return 'placeholder:default';
  }

  return 'placeholder:default';
}


// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
