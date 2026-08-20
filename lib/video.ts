/**
 * Parses a YouTube or Vimeo URL into a safe, canonical embed.
 *
 * THIS IS A SECURITY BOUNDARY. The pasted URL is attacker-influenced content
 * that ends up as an <iframe src> on a public page — the classic way that goes
 * wrong is rendering the raw string, which lets someone embed an arbitrary
 * origin (a phishing frame, a clickjacking overlay, a coin miner). So the URL
 * is never passed through. Only the video id is extracted, validated against a
 * strict character class, and substituted into a fixed template for a known
 * host. Anything unrecognised returns null and renders nothing.
 *
 * youtube-nocookie.com is used deliberately: it does not set tracking cookies
 * until the visitor actually plays, which pairs with the click-to-load facade
 * so a page with three videos costs three thumbnails, not three player SDKs.
 */

export type VideoProvider = 'youtube' | 'vimeo';

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  /** The iframe src. Built from a template — never the input URL. */
  embedUrl: string;
  /** A poster image, or null when the provider has no free thumbnail URL. */
  thumbnailUrl: string | null;
  /** Where "watch on YouTube/Vimeo" should point. Also template-built. */
  watchUrl: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

function youtubeId(url: URL): string | null {
  // youtu.be/<id>
  if (url.hostname === 'youtu.be') {
    return url.pathname.slice(1).split('/')[0] || null;
  }
  // youtube.com/watch?v=<id>
  const v = url.searchParams.get('v');
  if (v) return v;
  // youtube.com/embed/<id> and youtube.com/shorts/<id>
  const m = /^\/(?:embed|shorts|v)\/([^/?#]+)/.exec(url.pathname);
  return m ? m[1] : null;
}

function vimeoId(url: URL): string | null {
  // vimeo.com/<id> or player.vimeo.com/video/<id>; also /channels/x/<id> etc.,
  // so take the last all-digit path segment.
  const segments = url.pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(segments[i])) return segments[i];
  }
  return null;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // http(s) only — no javascript:, data:, or protocol-relative sneaking in.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeId(url);
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      provider: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (VIMEO_HOSTS.has(host)) {
    const id = vimeoId(url);
    if (!id || !VIMEO_ID.test(id)) return null;
    return {
      provider: 'vimeo',
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
      // Vimeo has no free fixed-URL thumbnail; the facade shows a play card.
      thumbnailUrl: null,
      watchUrl: `https://vimeo.com/${id}`,
    };
  }

  return null;
}

/** True when the URL is a recognised, embeddable video. Used by the admin to
 *  flag a bad paste before it is saved. */
export function isEmbeddableVideo(raw: string): boolean {
  return parseVideoUrl(raw) !== null;
}
