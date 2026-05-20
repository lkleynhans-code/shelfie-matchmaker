import { useState, useEffect, useCallback } from 'react';
import type { ReaderProfile, ReadingFormat } from '../types';
import { READING_FORMATS, BOOK_GENRES } from '../types';

interface Props {
  readerProfile: ReaderProfile;
  onChange: (patch: Partial<ReaderProfile>) => void;
}

function Section({ title, descriptor, children }: { title: string; descriptor: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: 16 }}>
      <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{title}</p>
      <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 14px' }}>{descriptor}</p>
      {children}
    </div>
  );
}

const notesStyle: React.CSSProperties = {
  width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)',
  border: '1px solid var(--sp-border)', borderRadius: 6, padding: '8px 10px',
  fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', marginTop: 10,
};

const longTextStyle: React.CSSProperties = {
  width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)',
  border: '1px solid var(--sp-border)', borderRadius: 6, padding: '10px 12px',
  fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6,
};

function focusGreen(e: React.FocusEvent<HTMLElement>) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sp-green)'; }
function blurBorder(e: React.FocusEvent<HTMLElement>) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sp-border)'; }

export default function ReaderProfileView({ readerProfile, onChange }: Props) {
  const [draft, setDraft] = useState<ReaderProfile>(readerProfile);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync if parent resets the profile (e.g. on first load)
  useEffect(() => { setDraft(readerProfile); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((update: Partial<ReaderProfile>) => {
    setDraft((prev) => ({ ...prev, ...update }));
    setDirty(true);
    setSaved(false);
  }, []);

  function handleSave() {
    onChange(draft);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleGenre(genre: string) {
    const next = draft.preferredGenres.includes(genre)
      ? draft.preferredGenres.filter((g) => g !== genre)
      : [...draft.preferredGenres, genre];
    patch({ preferredGenres: next });
  }

  const {
    booksPerYear, booksPerYearNotes,
    preferredFormat, preferredFormatNotes,
    preferredGenres, preferredGenresNotes,
    typicallyEnjoy, typicallyDislike,
  } = draft;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ color: 'var(--sp-white)', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Reader Profile</h2>
        <p style={{ color: 'var(--sp-text)', fontSize: 13, margin: 0 }}>
          Tell us about your reading habits. This context helps Matchmaker give you better recommendations.
        </p>
      </div>

      {/* Books per year */}
      <Section title="How many books do you read in a year?" descriptor="Drag the slider to your approximate annual reading count.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            type="range" min={0} max={100} step={1}
            value={booksPerYear}
            onChange={(e) => patch({ booksPerYear: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--sp-green)', cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--sp-green)', fontWeight: 800, fontSize: 20, minWidth: 36, textAlign: 'right' }}>
            {booksPerYear}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ color: 'var(--sp-muted)', fontSize: 10 }}>0</span>
          <span style={{ color: 'var(--sp-muted)', fontSize: 10 }}>100</span>
        </div>
        <textarea
          value={booksPerYearNotes}
          onChange={(e) => patch({ booksPerYearNotes: e.target.value })}
          placeholder="Any context about your reading pace..."
          rows={2}
          style={notesStyle}
          onFocus={focusGreen} onBlur={blurBorder}
        />
      </Section>

      {/* Preferred format */}
      <Section title="What is your preferred reading format?" descriptor="Select the format you most commonly read or listen to books in.">
        <select
          value={preferredFormat}
          onChange={(e) => patch({ preferredFormat: e.target.value as ReadingFormat })}
          style={{
            width: '100%', background: 'var(--sp-elevated)', color: preferredFormat ? 'var(--sp-white)' : 'var(--sp-muted)',
            border: '1px solid var(--sp-border)', borderRadius: 6, padding: '10px 12px',
            fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}
          onFocus={focusGreen} onBlur={blurBorder}
        >
          <option value="" disabled style={{ color: 'var(--sp-muted)' }}>Select a format...</option>
          {READING_FORMATS.map(({ value, label }) => (
            <option key={value} value={value} style={{ background: 'var(--sp-elevated)', color: 'var(--sp-white)' }}>{label}</option>
          ))}
        </select>
        <textarea
          value={preferredFormatNotes}
          onChange={(e) => patch({ preferredFormatNotes: e.target.value })}
          placeholder="Any context about your format preferences..."
          rows={2}
          style={notesStyle}
          onFocus={focusGreen} onBlur={blurBorder}
        />
      </Section>

      {/* Preferred genres */}
      <Section title="What are your preferred genres?" descriptor="Select all the genres you typically enjoy reading.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BOOK_GENRES.map((genre) => {
            const selected = preferredGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                style={{
                  background: selected ? 'var(--sp-green)' : 'var(--sp-elevated)',
                  color: selected ? '#000' : 'var(--sp-text)',
                  border: selected ? 'none' : '1px solid var(--sp-border)',
                  borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: selected ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--sp-text)'; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--sp-border)'; }}
              >
                {genre}
              </button>
            );
          })}
        </div>
        {preferredGenres.length > 0 && (
          <p style={{ color: 'var(--sp-muted)', fontSize: 11, margin: '8px 0 0' }}>
            {preferredGenres.length} genre{preferredGenres.length !== 1 ? 's' : ''} selected
          </p>
        )}
        <textarea
          value={preferredGenresNotes}
          onChange={(e) => patch({ preferredGenresNotes: e.target.value })}
          placeholder="Any context about your genre preferences..."
          rows={2}
          style={notesStyle}
          onFocus={focusGreen} onBlur={blurBorder}
        />
      </Section>

      {/* Typically enjoy */}
      <div style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: 16 }}>
        <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Things you typically enjoy in books</p>
        <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 10px' }}>
          Describe recurring themes, tropes, story elements, or writing styles that you consistently enjoy.
        </p>
        <textarea
          value={typicallyEnjoy}
          onChange={(e) => patch({ typicallyEnjoy: e.target.value })}
          placeholder="e.g. slow-burn romance, unreliable narrators, detailed world-building, plot twists..."
          rows={4}
          style={longTextStyle}
          onFocus={focusGreen} onBlur={blurBorder}
        />
      </div>

      {/* Typically dislike */}
      <div style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: 16, marginBottom: 8 }}>
        <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Things you typically do not enjoy in books</p>
        <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 10px' }}>
          Describe recurring themes, tropes, story elements, or writing styles that consistently put you off.
        </p>
        <textarea
          value={typicallyDislike}
          onChange={(e) => patch({ typicallyDislike: e.target.value })}
          placeholder="e.g. cliffhanger endings, love triangles, excessive gore, info-dumping..."
          rows={4}
          style={longTextStyle}
          onFocus={focusGreen} onBlur={blurBorder}
        />
      </div>

      {/* Save button */}
      <div style={{ paddingBottom: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            width: '100%', padding: '14px 0',
            background: saved ? 'transparent' : 'var(--sp-green)',
            border: saved ? '1px solid var(--sp-green)' : 'none',
            borderRadius: 24,
            color: saved ? 'var(--sp-green)' : '#000',
            fontSize: 14, fontWeight: 700, cursor: dirty || saved ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: !dirty && !saved ? 0.4 : 1,
          }}
          disabled={!dirty && !saved}
          onMouseEnter={(e) => { if (dirty && !saved) e.currentTarget.style.background = 'var(--sp-green-hover)'; }}
          onMouseLeave={(e) => { if (dirty && !saved) e.currentTarget.style.background = 'var(--sp-green)'; }}
        >
          {saved ? (
            <>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Profile updated
            </>
          ) : (
            'Update Profile'
          )}
        </button>
        {dirty && !saved && (
          <p style={{ color: 'var(--sp-muted)', fontSize: 11, textAlign: 'center', margin: '6px 0 0' }}>
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}
