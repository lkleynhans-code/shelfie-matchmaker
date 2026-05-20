import { useState, useEffect } from 'react';
import type { ProfileEntry, BookRatings, RatingCategory } from '../types';
import { RATING_CATEGORIES, DEFAULT_RATINGS } from '../types';

interface Props {
  entry: ProfileEntry | null;
  readOnly?: boolean;
  onSave: (entryId: string, ratings: BookRatings) => void;
  onEdit?: () => void;
  onClose: () => void;
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={star <= display ? 'var(--sp-green)' : 'var(--sp-border)'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StaticStars({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: 'var(--sp-muted)', fontSize: 12, fontStyle: 'italic' }}>Not rated</span>;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="22" height="22" viewBox="0 0 24 24" fill={s <= value ? 'var(--sp-green)' : 'var(--sp-border)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ color: 'var(--sp-green)', fontSize: 12, fontWeight: 700, marginLeft: 4 }}>{value}/5</span>
    </div>
  );
}

export default function RatingModal({ entry, readOnly = false, onSave, onEdit, onClose }: Props) {
  const [ratings, setRatings] = useState<BookRatings>(structuredClone(DEFAULT_RATINGS));

  useEffect(() => {
    if (entry) setRatings(structuredClone(entry.ratings));
  }, [entry]);

  if (!entry) return null;
  const currentEntry = entry;

  function updateCategory(key: keyof Omit<BookRatings, 'generalNotes'>, patch: Partial<RatingCategory>) {
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function handleSave() {
    onSave(currentEntry.id, ratings);
    onClose();
  }

  const input = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      style={{
        width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)',
        border: '1px solid var(--sp-border)', borderRadius: 6, padding: '8px 10px',
        fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none',
        marginTop: 6,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')}
    />
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />

      {/* Bottom sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 430,
        background: 'var(--sp-surface)', borderRadius: '16px 16px 0 0',
        maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--sp-border)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px 14px', borderBottom: '1px solid var(--sp-border)' }}>
          {currentEntry.book.coverUrl && (
            <img src={currentEntry.book.coverUrl} alt="" style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentEntry.book.title}</p>
            <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '3px 0 0' }}>{currentEntry.book.author}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sp-text)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {RATING_CATEGORIES.map(({ key, label, description }) => (
            <div key={key} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid var(--sp-border)' }}>
              <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{label}</p>
              <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 10px' }}>{description}</p>
              {readOnly ? (
                <>
                  <StaticStars value={ratings[key].score} />
                  {ratings[key].note && (
                    <p style={{ color: 'var(--sp-text)', fontSize: 12, fontStyle: 'italic', margin: '8px 0 0', lineHeight: 1.5 }}>"{ratings[key].note}"</p>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StarRating value={ratings[key].score} onChange={(v) => updateCategory(key, { score: v === 0 ? null : v })} />
                    {ratings[key].score && <span style={{ color: 'var(--sp-green)', fontSize: 12, fontWeight: 700 }}>{ratings[key].score}/5</span>}
                  </div>
                  {input(ratings[key].note, (v) => updateCategory(key, { note: v }), `Notes on ${label.toLowerCase()}...`)}
                </>
              )}
            </div>
          ))}

          {/* General Notes */}
          <div>
            <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>General Notes</p>
            <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 10px' }}>Share any final thoughts here</p>
            {readOnly ? (
              ratings.generalNotes
                ? <p style={{ color: 'var(--sp-text)', fontSize: 12, fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{ratings.generalNotes}"</p>
                : <span style={{ color: 'var(--sp-muted)', fontSize: 12, fontStyle: 'italic' }}>No notes added</span>
            ) : (
              <textarea
                value={ratings.generalNotes}
                onChange={(e) => setRatings((prev) => ({ ...prev, generalNotes: e.target.value }))}
                placeholder="Anything else on your mind about this book..."
                rows={3}
                style={{ width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)', border: '1px solid var(--sp-border)', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid var(--sp-border)' }}>
          {readOnly ? (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: 'none', border: '1px solid var(--sp-border)', borderRadius: 24, color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
              <button
                onClick={onEdit}
                style={{ flex: 2, padding: '12px 0', background: 'var(--sp-green)', border: 'none', borderRadius: 24, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-green-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sp-green)')}
              >
                Edit Ratings
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: 'none', border: '1px solid var(--sp-border)', borderRadius: 24, color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{ flex: 2, padding: '12px 0', background: 'var(--sp-green)', border: 'none', borderRadius: 24, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-green-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sp-green)')}
              >
                Save Ratings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
