import { LinkPreviewData } from '../types/index.js';

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData | null> {
  try {
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace(/^www\./, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OrbitBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url,
        title: domain,
        description: '',
        image: '',
        domain,
      };
    }

    const html = await response.text();

    // Extract OpenGraph or standard meta tags
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title>(.*?)<\/title>/i);

    const descMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:description["']\s+content=["'](.*?)["']/i);

    const imageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);

    let image = imageMatch ? imageMatch[1] : '';
    if (image && !image.startsWith('http://') && !image.startsWith('https://')) {
      image = new URL(image, url).toString();
    }

    return {
      url,
      title: titleMatch ? decodeHTMLEntities(titleMatch[1]) : domain,
      description: descMatch ? decodeHTMLEntities(descMatch[1]) : '',
      image: image || '',
      domain,
    };
  } catch (error) {
    try {
      const parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      return {
        url: rawUrl,
        title: parsedUrl.hostname,
        description: '',
        image: '',
        domain: parsedUrl.hostname,
      };
    } catch {
      return null;
    }
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}
