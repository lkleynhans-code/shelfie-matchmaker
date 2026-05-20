import { useState, useCallback, useEffect } from 'react';
import type { ProfileEntry, TbrEntry, Book, BookRatings, RatingCategory, ReaderProfile, MatchFeedback, MatchHistoryEntry } from '../types';
import { DEFAULT_RATINGS, DEFAULT_READER_PROFILE } from '../types';

const STORAGE_KEY = 'readmatch_profile';
const TBR_STORAGE_KEY = 'readmatch_tbr';
const API_KEY_STORAGE = 'readmatch_openai_key';
const BASE_URL_STORAGE = 'readmatch_base_url';
const MODEL_STORAGE = 'readmatch_model';
const SPOTIFY_CLIENT_ID_STORAGE = 'readmatch_spotify_client_id';
const SPOTIFY_CLIENT_SECRET_STORAGE = 'readmatch_spotify_client_secret';
const SPOTIFY_MARKET_STORAGE = 'readmatch_spotify_market';
const READER_PROFILE_STORAGE = 'readmatch_reader_profile';
const FEEDBACK_STORAGE = 'readmatch_feedback';
const HISTORY_STORAGE = 'readmatch_match_history';

export const DEFAULT_MODEL = 'gpt-4o-mini';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isSpotifyBook(entry: { book: { key: string } }) {
  return entry.book.key.startsWith('spotify_');
}

/** Migrate ratings from old schema to current schema. */
function migrateRatings(raw: Record<string, unknown>): BookRatings {
  const empty = (): RatingCategory => ({ score: null, note: '' });
  const pick = (key: string): RatingCategory => {
    const val = raw[key] as RatingCategory | undefined;
    return val && typeof val === 'object' ? val : empty();
  };
  return {
    characters: pick('characters'),
    plot: pick('plot'),
    // writingStyle → writingQuality
    writingQuality: pick('writingQuality') ?? pick('writingStyle'),
    // enjoyability is new
    enjoyability: pick('enjoyability'),
    narrator: pick('narrator'),
    generalNotes: typeof raw['generalNotes'] === 'string' ? raw['generalNotes'] : '',
  };
}

function migrateProfile(entries: ProfileEntry[]): ProfileEntry[] {
  return entries.map((e) => ({
    ...e,
    ratings: migrateRatings(e.ratings as unknown as Record<string, unknown>),
  }));
}

export function useProfileStore() {
  const [profile, setProfile] = useState<ProfileEntry[]>(() =>
    migrateProfile((loadJson(STORAGE_KEY, []) as ProfileEntry[]).filter(isSpotifyBook))
  );
  const [tbr, setTbr] = useState<TbrEntry[]>(() =>
    (loadJson(TBR_STORAGE_KEY, []) as TbrEntry[]).filter(isSpotifyBook)
  );
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE) ?? '');
  const [baseUrl, setBaseUrlState] = useState<string>(() => localStorage.getItem(BASE_URL_STORAGE) ?? '');
  const [model, setModelState] = useState<string>(() => localStorage.getItem(MODEL_STORAGE) ?? DEFAULT_MODEL);
  const [spotifyClientId, setSpotifyClientIdState] = useState<string>(() => localStorage.getItem(SPOTIFY_CLIENT_ID_STORAGE) ?? '');
  const [spotifyClientSecret, setSpotifyClientSecretState] = useState<string>(() => localStorage.getItem(SPOTIFY_CLIENT_SECRET_STORAGE) ?? '');
  const [spotifyMarket, setSpotifyMarketState] = useState<string>(() => localStorage.getItem(SPOTIFY_MARKET_STORAGE) ?? 'US');
  const [readerProfile, setReaderProfileState] = useState<ReaderProfile>(() => ({
    ...DEFAULT_READER_PROFILE,
    ...loadJson<Partial<ReaderProfile>>(READER_PROFILE_STORAGE, {}),
  }));
  const [matchFeedback, setMatchFeedbackState] = useState<MatchFeedback[]>(() =>
    loadJson<MatchFeedback[]>(FEEDBACK_STORAGE, [])
  );
  const [matchHistory, setMatchHistoryState] = useState<MatchHistoryEntry[]>(() =>
    loadJson<MatchHistoryEntry[]>(HISTORY_STORAGE, [])
  );

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(TBR_STORAGE_KEY, JSON.stringify(tbr)); }, [tbr]);

  const setApiKey = useCallback((key: string) => { setApiKeyState(key); localStorage.setItem(API_KEY_STORAGE, key); }, []);
  const setBaseUrl = useCallback((url: string) => { setBaseUrlState(url); localStorage.setItem(BASE_URL_STORAGE, url); }, []);
  const setModel = useCallback((m: string) => { setModelState(m); localStorage.setItem(MODEL_STORAGE, m); }, []);
  const setSpotifyClientId = useCallback((id: string) => { setSpotifyClientIdState(id); localStorage.setItem(SPOTIFY_CLIENT_ID_STORAGE, id); }, []);
  const setSpotifyClientSecret = useCallback((secret: string) => { setSpotifyClientSecretState(secret); localStorage.setItem(SPOTIFY_CLIENT_SECRET_STORAGE, secret); }, []);
  const setSpotifyMarket = useCallback((market: string) => { setSpotifyMarketState(market); localStorage.setItem(SPOTIFY_MARKET_STORAGE, market); }, []);

  const setReaderProfile = useCallback((patch: Partial<ReaderProfile>) => {
    setReaderProfileState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(READER_PROFILE_STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  const addToHistory = useCallback((entry: MatchHistoryEntry) => {
    setMatchHistoryState((prev) => {
      // Replace if same book was already run, otherwise prepend
      const filtered = prev.filter((h) => h.book.key !== entry.book.key);
      const next = [entry, ...filtered];
      localStorage.setItem(HISTORY_STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  const upsertFeedback = useCallback((feedback: MatchFeedback) => {
    setMatchFeedbackState((prev) => {
      // Replace existing feedback for same book, or prepend new
      const filtered = prev.filter((f) => f.bookKey !== feedback.bookKey);
      const next = [feedback, ...filtered];
      localStorage.setItem(FEEDBACK_STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Bookshelf ──────────────────────────────────────────────────────────────

  const addBook = useCallback((book: Book): ProfileEntry => {
    const entry: ProfileEntry = {
      id: crypto.randomUUID(),
      book,
      ratings: structuredClone(DEFAULT_RATINGS),
      addedAt: new Date().toISOString(),
    };
    setProfile((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const updateRatings = useCallback((entryId: string, ratings: BookRatings) => {
    setProfile((prev) => prev.map((e) => (e.id === entryId ? { ...e, ratings } : e)));
  }, []);

  const removeBook = useCallback((entryId: string) => {
    setProfile((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const isInProfile = useCallback(
    (bookKey: string) => profile.some((e) => e.book.key === bookKey),
    [profile],
  );

  // ── TBR ───────────────────────────────────────────────────────────────────

  const addToTbr = useCallback((book: Book): TbrEntry => {
    const entry: TbrEntry = {
      id: crypto.randomUUID(),
      book,
      addedAt: new Date().toISOString(),
    };
    setTbr((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const removeFromTbr = useCallback((entryId: string) => {
    setTbr((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const isInTbr = useCallback(
    (bookKey: string) => tbr.some((e) => e.book.key === bookKey),
    [tbr],
  );

  /** Move a TBR entry onto the bookshelf — removes from TBR and adds to profile. */
  const promoteFromTbr = useCallback((tbrEntryId: string): ProfileEntry | null => {
    let promoted: ProfileEntry | null = null;
    setTbr((prev) => {
      const entry = prev.find((e) => e.id === tbrEntryId);
      if (!entry) return prev;
      const profileEntry: ProfileEntry = {
        id: crypto.randomUUID(),
        book: entry.book,
        ratings: structuredClone(DEFAULT_RATINGS),
        addedAt: new Date().toISOString(),
      };
      promoted = profileEntry;
      setProfile((p) => [profileEntry, ...p]);
      return prev.filter((e) => e.id !== tbrEntryId);
    });
    return promoted;
  }, []);

  return {
    profile,
    tbr,
    apiKey,
    baseUrl,
    model,
    spotifyClientId,
    spotifyClientSecret,
    spotifyMarket,
    readerProfile,
    matchFeedback,
    matchHistory,
    setApiKey,
    setBaseUrl,
    setModel,
    setSpotifyClientId,
    setSpotifyClientSecret,
    setSpotifyMarket,
    setReaderProfile,
    upsertFeedback,
    addToHistory,
    addBook,
    updateRatings,
    removeBook,
    isInProfile,
    addToTbr,
    removeFromTbr,
    isInTbr,
    promoteFromTbr,
  };
}
