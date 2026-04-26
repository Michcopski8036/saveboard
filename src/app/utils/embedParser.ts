// Parse embed code to extract URL and metadata
export function parseEmbedCode(input: string): {
  url: string;
  title?: string;
  description?: string;
  image?: string;
} | null {
  // Check if input is an embed code
  if (!input.includes('<') || !input.includes('>')) {
    return null;
  }

  try {
    // Parse Instagram embed code
    if (input.includes('instagram.com')) {
      // Extract URL from Instagram embed
      const urlMatch = input.match(/https?:\/\/(?:www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/);
      if (urlMatch) {
        return {
          url: urlMatch[0],
          title: 'Instagram Post',
          description: 'Embedded Instagram post',
          image: 'placeholder:instagram'
        };
      }

      // Try to extract from data-instgrm-permalink
      const permalinkMatch = input.match(/data-instgrm-permalink="([^"]+)"/);
      if (permalinkMatch) {
        return {
          url: permalinkMatch[1],
          title: 'Instagram Post',
          description: 'Embedded Instagram post',
          image: 'placeholder:instagram'
        };
      }
    }

    // Parse YouTube embed code
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
      const youtubeMatch = input.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return {
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: 'YouTube Video',
          description: 'Embedded YouTube video',
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }

    // Parse Twitter/X embed code
    if (input.includes('twitter.com') || input.includes('x.com')) {
      const twitterMatch = input.match(/https?:\/\/(?:twitter|x)\.com\/[^/]+\/status\/\d+/);
      if (twitterMatch) {
        return {
          url: twitterMatch[0],
          title: 'Twitter/X Post',
          description: 'Embedded Twitter post',
          image: 'placeholder:twitter'
        };
      }
    }

    // Generic iframe src extraction
    const iframeSrcMatch = input.match(/src="([^"]+)"/);
    if (iframeSrcMatch) {
      return {
        url: iframeSrcMatch[1],
        title: 'Embedded Content',
        description: 'Embedded media content'
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing embed code:', error);
    return null;
  }
}

