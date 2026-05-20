import type { Book } from '../types';
import { searchSpotifyAudiobooks, hasSpotifyCredentials } from './spotifySearch';
import type { SpotifyCredentials } from './spotifySearch';

export interface SearchConfig {
  spotify?: Partial<SpotifyCredentials>;
}

export interface SearchResult {
  books: Book[];
  error?: string;
  /** true when results come from Open Library because Spotify is unavailable */
  fallback?: boolean;
}

async function searchItunesAudiobooks(query: string): Promise<Book[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=audiobook&limit=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes search failed (${res.status})`);
  const data = await res.json() as {
    results?: Array<{
      collectionId: number;
      collectionName?: string;
      artistName?: string;
      artworkUrl100?: string;
      primaryGenreName?: string;
    }>;
  };
  return (data.results ?? [])
    .filter((r) => r.collectionName)
    .map((r) => ({
      key: `itunes-${r.collectionId}`,
      title: r.collectionName ?? 'Unknown Title',
      author: r.artistName ?? 'Unknown Author',
      coverUrl: r.artworkUrl100?.replace('100x100', '200x200'),
      subjects: r.primaryGenreName ? [r.primaryGenreName] : undefined,
    }));
}

export async function searchBooks(
  query: string,
  config: SearchConfig = {},
): Promise<SearchResult> {
  if (!query.trim()) return { books: [] };

  const { spotify } = config;

  if (!spotify || !hasSpotifyCredentials(spotify)) {
    return { books: [], error: 'no_credentials' };
  }

  try {
    const books = await searchSpotifyAudiobooks(query, spotify);
    return { books };
  } catch {
    // Always try iTunes audiobook search as a fallback when Spotify fails
    try {
      const books = await searchItunesAudiobooks(query);
      return { books, fallback: true };
    } catch (fbErr) {
      const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
      return { books: [], error: `Spotify unavailable. Fallback search also failed: ${fbMsg}` };
    }
  }
}
