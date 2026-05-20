import { useState, useRef, useEffect, useCallback } from 'react';
import type { Book } from '../types';
import { searchBooks } from '../services/bookSearch';
import type { SearchConfig } from '../services/bookSearch';
import { identifyBooksFromImage } from '../services/imageSearch';
import type { IdentifiedBook, VisionConfig } from '../services/imageSearch';
import PhotoSearchModal from './PhotoSearchModal';

interface Props {
  onSelect: (book: Book) => void;
  onSelectMultiple?: (books: Book[]) => void;
  multiSelectLabel?: string;
  searchConfig?: SearchConfig;
  visionConfig?: VisionConfig;
}

export default function BookSearchBar({ onSelect, onSelectMultiple, multiSelectLabel = 'Add selected', searchConfig = {}, visionConfig }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState('');
  const [photoModalBooks, setPhotoModalBooks] = useState<IdentifiedBook[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCredentials = Boolean(
    searchConfig?.spotify?.clientId && searchConfig?.spotify?.clientSecret
  );

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setError('');
    setIsFallback(false);
    try {
      const { books, error: searchError, fallback } = await searchBooks(q, searchConfig);
      if (searchError === 'no_credentials') {
        setError('no_credentials');
      } else if (searchError) {
        setError(searchError);
      } else {
        setResults(books);
        setIsFallback(fallback ?? false);
        setOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [searchConfig]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !visionConfig) return;
    e.target.value = '';

    setVisionLoading(true);
    setVisionError('');
    setError('');
    setResults([]);
    setOpen(false);

    try {
      const books = await identifyBooksFromImage(file, visionConfig);
      if (books.length === 0) {
        setVisionError("Couldn't identify any books in that photo. Try a clearer image of the cover or spine.");
        return;
      }

      // Single book: use the existing inline search flow
      if (books.length === 1) {
        const b = books[0];
        const searchQuery = b.author ? `${b.title} ${b.author}` : b.title;
        setQuery(searchQuery);
        setLoading(true);
        setIsFallback(false);
        const { books: results, error: searchError, fallback } = await searchBooks(searchQuery, searchConfig);
        if (searchError === 'no_credentials') {
          setError('no_credentials');
        } else if (searchError) {
          setError(searchError);
        } else {
          setResults(results);
          setIsFallback(fallback ?? false);
          setOpen(true);
        }
        setLoading(false);
        return;
      }

      // Multiple books: open the selection modal
      setPhotoModalBooks(books);
    } catch (err) {
      setVisionError(err instanceof Error ? err.message : 'Photo search failed.');
    } finally {
      setVisionLoading(false);
    }
  }

  function handleSelect(book: Book) {
    setQuery(''); setResults([]); setOpen(false); setError(''); setIsFallback(false);
    onSelect(book);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Text search input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#000', pointerEvents: 'none' }}
            width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hasCredentials ? 'Search Spotify audiobooks...' : 'Add Spotify credentials in Settings to search'}
            disabled={!hasCredentials || visionLoading}
            style={{
              width: '100%', background: 'var(--sp-white)', color: '#000',
              border: 'none', borderRadius: 6, padding: '12px 40px 12px 42px',
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              opacity: hasCredentials ? 1 : 0.5, cursor: hasCredentials ? 'text' : 'not-allowed',
            }}
          />
          {(loading || visionLoading) && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--sp-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
        </div>

        {/* Camera / photo search button */}
        {visionConfig?.apiKey && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={visionLoading}
              title="Search by photo"
              style={{
                flexShrink: 0, width: 44, height: 44,
                background: visionLoading ? 'var(--sp-elevated)' : 'var(--sp-surface)',
                border: '1px solid var(--sp-border)', borderRadius: 6,
                color: visionLoading ? 'var(--sp-muted)' : 'var(--sp-text)',
                cursor: visionLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={(e) => { if (!visionLoading) e.currentTarget.style.borderColor = 'var(--sp-green)'; e.currentTarget.style.color = 'var(--sp-green)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--sp-border)'; e.currentTarget.style.color = 'var(--sp-text)'; }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Vision loading status */}
      {visionLoading && (
        <p style={{ color: 'var(--sp-text)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid var(--sp-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Identifying book from photo...
        </p>
      )}

      {/* Errors */}
      {visionError && (
        <p style={{ color: '#f15e6c', fontSize: 12, marginTop: 6 }}>{visionError}</p>
      )}
      {error && error !== 'no_credentials' && (
        <p style={{ color: '#f15e6c', fontSize: 12, marginTop: 6 }}>{error}</p>
      )}

      {/* Fallback banner */}
      {isFallback && open && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)',
          borderRadius: 6, padding: '7px 12px', marginTop: 6,
          color: '#fbbf24', fontSize: 11, lineHeight: 1.4,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Spotify is currently unavailable — showing general book results instead
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <ul style={{
          position: 'absolute', zIndex: 100, width: '100%', top: '100%', marginTop: 4,
          background: 'var(--sp-elevated)', borderRadius: 8, maxHeight: 360, overflowY: 'auto',
          listStyle: 'none', margin: '4px 0 0', padding: 0, border: '1px solid var(--sp-border)',
        }}>
          {results.map((book) => (
            <li key={book.key} style={{ borderBottom: '1px solid var(--sp-border)' }}>
              <button
                type="button"
                onClick={() => handleSelect(book)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ flexShrink: 0, width: 40, height: 56, background: 'var(--sp-border)', borderRadius: 4, overflow: 'hidden' }}>
                  {book.coverUrl
                    ? <img src={book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</p>
                  <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.author}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div style={{ position: 'absolute', zIndex: 100, width: '100%', top: '100%', marginTop: 4, background: 'var(--sp-elevated)', borderRadius: 8, padding: '20px 16px', textAlign: 'center', color: 'var(--sp-text)', fontSize: 13, border: '1px solid var(--sp-border)' }}>
          {isFallback ? `No results found for "${query}"` : `No audiobooks found for "${query}" on Spotify`}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {photoModalBooks && (
        <PhotoSearchModal
          identified={photoModalBooks}
          searchConfig={searchConfig}
          actionLabel={multiSelectLabel}
          onConfirm={(books) => {
            if (onSelectMultiple) {
              onSelectMultiple(books);
            } else {
              // Fallback: select the first one via the normal flow
              if (books[0]) onSelect(books[0]);
            }
          }}
          onClose={() => setPhotoModalBooks(null)}
        />
      )}
    </div>
  );
}
