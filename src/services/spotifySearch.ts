import type { Book } from '../types';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SEARCH_URL = 'https://api.spotify.com/v1/search';

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
  market?: string; // ISO 3166-1 alpha-2 country code, e.g. "US", "GB", "ZA"
}

// Module-level token cache — valid for 1 hour per Spotify's spec
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(creds: SpotifyCredentials): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const basic = btoa(`${creds.clientId}:${creds.clientSecret}`);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify auth failed (${res.status}): ${text || 'no detail'}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // Expire 60 s early to avoid edge-case stale tokens
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

interface SpotifyAudiobook {
  id: string;
  name: string;
  authors: Array<{ name: string }>;
  images: Array<{ url: string; width: number; height: number }>;
  publisher?: string;
  edition?: string;
}

function audiobookToBook(ab: SpotifyAudiobook): Book {
  // Pick the medium-sized image (Spotify returns three sizes: 640, 300, 64)
  const cover =
    ab.images.find((img) => img.width <= 300 && img.width >= 200)?.url ??
    ab.images[1]?.url ??
    ab.images[0]?.url;

  return {
    key: `spotify_${ab.id}`,
    title: ab.name,
    author: ab.authors.map((a) => a.name).join(', ') || 'Unknown Author',
    coverUrl: cover,
  };
}

export async function searchSpotifyAudiobooks(
  query: string,
  creds: SpotifyCredentials,
  limit = 12,
): Promise<Book[]> {
  if (!query.trim()) return [];

  const token = await getAccessToken(creds);

  const params = new URLSearchParams({
    q: query.trim(),
    type: 'audiobook',
    limit: String(Math.min(limit, 10)), // Spotify audiobooks: max limit is 10
    market: creds.market ?? 'US',
  });

  const res = await fetch(`${SEARCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    cachedToken = null;
    const body = await res.json().catch(() => null) as { error?: { message?: string } } | null;
    const detail = body?.error?.message ?? 'unknown';
    throw new Error(`Spotify search failed (${res.status}): ${detail}`);
  }

  const data = await res.json() as { audiobooks: { items: SpotifyAudiobook[] } };
  return (data.audiobooks?.items ?? []).map(audiobookToBook);
}

export function hasSpotifyCredentials(creds: Partial<SpotifyCredentials>): creds is SpotifyCredentials {
  return Boolean(creds.clientId?.trim() && creds.clientSecret?.trim());
}
