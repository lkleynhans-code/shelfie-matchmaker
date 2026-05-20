import type { ProfileEntry } from '../types';
import { RATING_CATEGORIES } from '../types';
import BookSearchBar from './BookSearchBar';
import type { SearchConfig } from '../services/bookSearch';
import type { VisionConfig } from '../services/imageSearch';
import type { Book } from '../types';

interface Props {
  profile: ProfileEntry[];
  onAddBook: (book: Book) => void;
  onViewRatings: (entry: ProfileEntry) => void;
  onEditRatings: (entry: ProfileEntry) => void;
  onRemoveBook: (entryId: string) => void;
  isInProfile: (bookKey: string) => boolean;
  searchConfig?: SearchConfig;
  visionConfig?: VisionConfig;
}

function ScoreDots({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: 10, color: 'var(--sp-muted)', fontStyle: 'italic' }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= score ? 'var(--sp-green)' : 'var(--sp-border)' }} />
      ))}
    </div>
  );
}

function ProfileBookCard({ entry, onView, onEdit, onRemove }: { entry: ProfileEntry; onView: () => void; onEdit: () => void; onRemove: () => void }) {
  const { book, ratings } = entry;
  return (
    <div style={{ background: 'var(--sp-surface)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 14, padding: 14 }}>
        <div style={{ flexShrink: 0, width: 56, height: 80, background: 'var(--sp-elevated)', borderRadius: 4, overflow: 'hidden' }}>
          {book.coverUrl
            ? <img src={book.coverUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--sp-white)', fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
              <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
              <button onClick={onView} style={{ background: 'none', border: '1px solid var(--sp-border)', borderRadius: 20, padding: '3px 10px', color: 'var(--sp-white)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>View</button>
              <button onClick={onEdit} title="Edit ratings" style={{ background: 'none', border: 'none', padding: 4, color: 'var(--sp-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={onRemove} title="Remove" style={{ background: 'none', border: 'none', padding: 4, color: 'var(--sp-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 10 }}>
            {RATING_CATEGORIES.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--sp-muted)', width: 64, flexShrink: 0 }}>{label}</span>
                <ScoreDots score={ratings[key].score} />
              </div>
            ))}
          </div>
          {ratings.generalNotes && (
            <p style={{ fontSize: 11, color: 'var(--sp-text)', marginTop: 8, fontStyle: 'italic', borderLeft: '2px solid var(--sp-border)', paddingLeft: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              "{ratings.generalNotes}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileView({ profile, onAddBook, onViewRatings, onEditRatings, onRemoveBook, isInProfile, searchConfig, visionConfig }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <p style={{ color: 'var(--sp-text)', fontSize: 13, margin: '0 0 12px' }}>
          Add books you've read and rate them to build your taste profile.
        </p>
        <BookSearchBar
          onSelect={(book) => { if (!isInProfile(book.key)) onAddBook(book); }}
          onSelectMultiple={(books) => books.forEach((b) => { if (!isInProfile(b.key)) onAddBook(b); })}
          multiSelectLabel="Add to Bookshelf"
          searchConfig={searchConfig}
          visionConfig={visionConfig}
        />
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <h2 style={{ color: 'var(--sp-white)', fontSize: 16, fontWeight: 700, margin: 0 }}>My Bookshelf</h2>
          <span style={{ color: 'var(--sp-muted)', fontSize: 12 }}>{profile.length} {profile.length === 1 ? 'book' : 'books'}</span>
        </div>
        {profile.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--sp-muted)' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" style={{ marginBottom: 12, opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p style={{ fontSize: 14, margin: 0 }}>Your bookshelf is empty</p>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Search above to add books you've read</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile.map((entry) => (
              <ProfileBookCard key={entry.id} entry={entry} onView={() => onViewRatings(entry)} onEdit={() => onEditRatings(entry)} onRemove={() => onRemoveBook(entry.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
