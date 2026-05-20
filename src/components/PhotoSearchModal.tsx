import { useState, useEffect } from 'react';
import type { Book } from '../types';
import type { IdentifiedBook } from '../services/imageSearch';
import { searchBooks } from '../services/bookSearch';
import type { SearchConfig } from '../services/bookSearch';

interface SearchedBook {
  query: IdentifiedBook;
  status: 'searching' | 'found' | 'not_found';
  result?: Book; // best Spotify match
}

interface Props {
  identified: IdentifiedBook[];
  searchConfig?: SearchConfig;
  actionLabel: string;        // e.g. "Add to Bookshelf", "Add to TBR", "Run Match Reports"
  onConfirm: (books: Book[]) => void;
  onClose: () => void;
}

export default function PhotoSearchModal({ identified, searchConfig, actionLabel, onConfirm, onClose }: Props) {
  const [searched, setSearched] = useState<SearchedBook[]>(
    identified.map((q) => ({ query: q, status: 'searching' }))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Search Spotify for every identified book in parallel
  useEffect(() => {
    identified.forEach((book, idx) => {
      const q = book.author ? `${book.title} ${book.author}` : book.title;
      searchBooks(q, searchConfig ?? {}).then(({ books }) => {
        const best = books[0];
        setSearched((prev) => {
          const next = [...prev];
          if (best) {
            next[idx] = { query: book, status: 'found', result: best };
            setSelected((s) => new Set([...s, best.key]));
          } else {
            next[idx] = { query: book, status: 'not_found' };
          }
          return next;
        });
      }).catch(() => {
        setSearched((prev) => {
          const next = [...prev];
          next[idx] = { query: book, status: 'not_found' };
          return next;
        });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const foundBooks = searched.filter((s) => s.status === 'found' && s.result).map((s) => s.result!);
  const selectedBooks = foundBooks.filter((b) => selected.has(b.key));
  const stillSearching = searched.some((s) => s.status === 'searching');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: 430,
        background: 'var(--sp-elevated)',
        borderRadius: '16px 16px 0 0',
        maxHeight: '85dvh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, background: 'var(--sp-border)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 16, margin: 0 }}>
              {stillSearching ? 'Finding books on Spotify...' : `Found ${foundBooks.length} of ${identified.length} books`}
            </p>
            <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '3px 0 0' }}>
              {stillSearching ? 'Searching Spotify for each title' : 'Select which books to include'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sp-muted)', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Book list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searched.map((item, idx) => {
              const book = item.result;
              const isChecked = book ? selected.has(book.key) : false;

              return (
                <div
                  key={idx}
                  onClick={() => book && toggleSelect(book.key)}
                  style={{
                    background: 'var(--sp-surface)', borderRadius: 10, padding: '12px 14px',
                    display: 'flex', gap: 12, alignItems: 'center',
                    border: `1px solid ${isChecked ? 'var(--sp-green)' : 'transparent'}`,
                    cursor: book ? 'pointer' : 'default',
                    opacity: item.status === 'not_found' ? 0.45 : 1,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${isChecked ? 'var(--sp-green)' : 'var(--sp-border)'}`,
                    background: isChecked ? 'var(--sp-green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isChecked && (
                      <svg width="11" height="11" fill="none" stroke="#000" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Cover */}
                  <div style={{ flexShrink: 0, width: 36, height: 52, background: 'var(--sp-elevated)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    {item.status === 'searching' ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 14, height: 14, border: '2px solid var(--sp-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      </div>
                    ) : book?.coverUrl ? (
                      <img src={book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.status === 'searching' ? (
                      <>
                        <p style={{ color: 'var(--sp-text)', fontSize: 13, margin: 0 }}>Searching for</p>
                        <p style={{ color: 'var(--sp-muted)', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.query.title}</p>
                      </>
                    ) : item.status === 'not_found' ? (
                      <>
                        <p style={{ color: 'var(--sp-text)', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.query.title}</p>
                        <p style={{ color: '#f15e6c', fontSize: 11, margin: '2px 0 0' }}>Not found on Spotify</p>
                      </>
                    ) : (
                      <>
                        <p style={{ color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book!.title}</p>
                        <p style={{ color: 'var(--sp-text)', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book!.author}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 32px', borderTop: '1px solid var(--sp-border)' }}>
          <button
            onClick={() => { onConfirm(selectedBooks); onClose(); }}
            disabled={selectedBooks.length === 0}
            style={{
              width: '100%', padding: '14px 0',
              background: selectedBooks.length === 0 ? 'var(--sp-border)' : 'var(--sp-green)',
              border: 'none', borderRadius: 24,
              color: selectedBooks.length === 0 ? 'var(--sp-muted)' : '#000',
              fontSize: 14, fontWeight: 700, cursor: selectedBooks.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            {selectedBooks.length === 0 ? 'Select books to continue' : `${actionLabel} (${selectedBooks.length})`}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
