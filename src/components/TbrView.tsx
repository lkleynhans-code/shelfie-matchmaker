import type { TbrEntry, Book } from '../types';
import BookSearchBar from './BookSearchBar';
import type { SearchConfig } from '../services/bookSearch';
import type { VisionConfig } from '../services/imageSearch';

interface Props {
  tbr: TbrEntry[];
  onAddToTbr: (book: Book) => void;
  onRemoveFromTbr: (entryId: string) => void;
  onMoveToBookshelf: (entryId: string) => void;
  isInTbr: (bookKey: string) => boolean;
  isInProfile: (bookKey: string) => boolean;
  searchConfig?: SearchConfig;
  visionConfig?: VisionConfig;
}

function TbrBookCard({ entry, onMoveToBookshelf, onRemove, alreadyOnBookshelf }: {
  entry: TbrEntry; onMoveToBookshelf: () => void; onRemove: () => void; alreadyOnBookshelf: boolean;
}) {
  const { book } = entry;
  const added = new Date(entry.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ background: 'var(--sp-surface)', borderRadius: 8, padding: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, width: 52, height: 74, background: 'var(--sp-elevated)', borderRadius: 4, overflow: 'hidden' }}>
          {book.coverUrl
            ? <img src={book.coverUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
            <p style={{ color: 'var(--sp-white)', fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{book.title}</p>
            <button onClick={onRemove} style={{ background: 'none', border: 'none', padding: 4, color: 'var(--sp-muted)', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Author + date + Rate & Add on the same row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
              <p style={{ color: 'var(--sp-muted)', fontSize: 11, margin: '2px 0 0' }}>Added {added}</p>
            </div>
            {alreadyOnBookshelf ? (
              <span style={{ flexShrink: 0, fontSize: 10, color: 'var(--sp-green)', fontWeight: 600 }}>On Bookshelf</span>
            ) : (
              <button
                onClick={onMoveToBookshelf}
                style={{
                  flexShrink: 0, background: 'var(--sp-green)', color: '#000', border: 'none', borderRadius: 12,
                  padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-green-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sp-green)')}
              >
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Rate & Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TbrView({ tbr, onAddToTbr, onRemoveFromTbr, onMoveToBookshelf, isInTbr, isInProfile, searchConfig, visionConfig }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <p style={{ color: 'var(--sp-text)', fontSize: 13, margin: '0 0 12px' }}>
          Save books you want to read. Move them to your Bookshelf once you've finished.
        </p>
        <BookSearchBar
          onSelect={(book) => { if (!isInTbr(book.key)) onAddToTbr(book); }}
          onSelectMultiple={(books) => books.forEach((b) => { if (!isInTbr(b.key)) onAddToTbr(b); })}
          multiSelectLabel="Add to TBR"
          searchConfig={searchConfig}
          visionConfig={visionConfig}
        />
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <h2 style={{ color: 'var(--sp-white)', fontSize: 16, fontWeight: 700, margin: 0 }}>To Be Read</h2>
          <span style={{ color: 'var(--sp-muted)', fontSize: 12 }}>{tbr.length} {tbr.length === 1 ? 'book' : 'books'}</span>
        </div>
        {tbr.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--sp-muted)' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" style={{ marginBottom: 12, opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p style={{ fontSize: 14, margin: 0 }}>Your TBR list is empty</p>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Search above to save books for later</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tbr.map((entry) => (
              <TbrBookCard
                key={entry.id} entry={entry}
                alreadyOnBookshelf={isInProfile(entry.book.key)}
                onMoveToBookshelf={() => onMoveToBookshelf(entry.id)}
                onRemove={() => onRemoveFromTbr(entry.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
