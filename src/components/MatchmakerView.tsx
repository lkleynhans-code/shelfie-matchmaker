import { useState } from 'react';
import type { Book, ProfileEntry, MatchResult, ReaderProfile, MatchFeedback, MatchHistoryEntry } from '../types';
import { getMatchPercentage } from '../services/matchmaker';
import BookSearchBar from './BookSearchBar';
import type { SearchConfig } from '../services/bookSearch';
import type { VisionConfig } from '../services/imageSearch';

interface Props {
  profile: ProfileEntry[];
  readerProfile?: ReaderProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  searchConfig?: SearchConfig;
  visionConfig?: VisionConfig;
  matchFeedback: MatchFeedback[];
  matchHistory: MatchHistoryEntry[];
  onNeedApiKey: () => void;
  onAddToTbr: (book: Book) => void;
  isInTbr: (bookKey: string) => boolean;
  onFeedback: (feedback: MatchFeedback) => void;
  onSaveHistory: (entry: MatchHistoryEntry) => void;
}

function MatchGauge({ percentage }: { percentage: number }) {
  const green = '#1DB954';
  const amber = '#f59e0b';
  const red = '#ef4444';
  const color = percentage >= 75 ? green : percentage >= 50 ? amber : red;
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 160, height: 80, overflow: 'hidden' }}>
        <svg viewBox="0 0 160 80" style={{ width: '100%', height: '100%' }}>
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#282828" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 220} 220`} />
        </svg>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', width: 2, height: 62,
          background: color, transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${angle}deg)`, transition: 'transform 0.8s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: -4, left: '50%', width: 12, height: 12, borderRadius: '50%',
          background: color, border: '2px solid var(--sp-bg)', transform: 'translateX(-50%)',
        }} />
      </div>
      <p style={{ fontSize: 40, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{percentage}%</p>
      <p style={{ fontSize: 13, color: 'var(--sp-text)', margin: 0, fontWeight: 500 }}>
        {percentage >= 75 ? 'Great match!' : percentage >= 50 ? 'Possible match' : 'Unlikely match'}
      </p>
    </div>
  );
}

interface BatchResult {
  book: Book;
  status: 'pending' | 'running' | 'done' | 'error';
  percentage?: number;
  explanation?: string;
  errorMsg?: string;
}

export default function MatchmakerView({ profile, readerProfile, apiKey, baseUrl, model, searchConfig, visionConfig, matchFeedback, matchHistory, onNeedApiKey, onAddToTbr, isInTbr, onFeedback, onSaveHistory }: Props) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackAgrees, setFeedbackAgrees] = useState<boolean | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchExpanded, setBatchExpanded] = useState<Set<number>>(new Set());
  const [historyExpanded, setHistoryExpanded] = useState<Set<string>>(new Set());

  async function handleMatch() {
    if (!selectedBook) return;
    if (!apiKey) { onNeedApiKey(); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const matchResult = await getMatchPercentage({ apiKey, baseUrl, model }, selectedBook, profile, readerProfile, matchFeedback);
      setResult(matchResult);
      onSaveHistory({
        id: crypto.randomUUID(),
        book: matchResult.book,
        percentage: matchResult.percentage,
        explanation: matchResult.explanation,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      const msg = err instanceof Error ? err.message : String(err);
      if (status === 401 || msg.toLowerCase().includes('invalid_api_key') || msg.toLowerCase().includes('incorrect api key')) {
        setError('Invalid API key. Check your key in Settings.');
      } else if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota')) {
        setError('No credits remaining. Add a credit balance at platform.openai.com/settings/billing.');
      } else {
        setError(`Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectBook(book: Book) {
    setSelectedBook(book); setResult(null); setError('');
    // Pre-fill any existing feedback for this book
    const existing = matchFeedback.find((f) => f.bookKey === book.key);
    setFeedbackAgrees(existing?.agrees ?? null);
    setFeedbackNote(existing?.note ?? '');
    setFeedbackSaved(false);
  }

  function handleReset() {
    setSelectedBook(null); setResult(null); setError('');
    setFeedbackAgrees(null); setFeedbackNote(''); setFeedbackSaved(false);
  }

  async function handleBatchMatch(books: Book[]) {
    if (!apiKey) { onNeedApiKey(); return; }
    setBatchResults(books.map((book) => ({ book, status: 'pending' })));
    setBatchRunning(true);
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      setBatchResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r));
      try {
        const matchResult = await getMatchPercentage({ apiKey, baseUrl, model }, book, profile, readerProfile, matchFeedback);
        onSaveHistory({ id: crypto.randomUUID(), book: matchResult.book, percentage: matchResult.percentage, explanation: matchResult.explanation, createdAt: new Date().toISOString() });
        setBatchResults((prev) => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'done', percentage: matchResult.percentage, explanation: matchResult.explanation } : r
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setBatchResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'error', errorMsg: msg } : r));
      }
    }
    setBatchRunning(false);
  }

  function handleSaveFeedback() {
    if (!result) return;
    onFeedback({
      id: crypto.randomUUID(),
      bookKey: result.book.key,
      bookTitle: result.book.title,
      bookAuthor: result.book.author,
      aiPercentage: result.percentage,
      agrees: feedbackAgrees,
      note: feedbackNote,
      createdAt: new Date().toISOString(),
    });
    setFeedbackSaved(true);
    setTimeout(() => setFeedbackSaved(false), 2500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ color: 'var(--sp-white)', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Are We a Match?</h2>
        <p style={{ color: 'var(--sp-text)', fontSize: 13, margin: 0 }}>
          Search for any book and see how well it fits your reading taste.
        </p>
      </div>

      {!result ? (
        <>
          <BookSearchBar
            onSelect={handleSelectBook}
            onSelectMultiple={handleBatchMatch}
            multiSelectLabel="Run Match Reports"
            searchConfig={searchConfig}
            visionConfig={visionConfig}
          />

          {selectedBook && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Selected book card */}
              <div style={{ background: 'var(--sp-surface)', borderRadius: 8, padding: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flexShrink: 0, width: 52, height: 74, background: 'var(--sp-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                  {selectedBook.coverUrl
                    ? <img src={selectedBook.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--sp-white)', fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedBook.title}</p>
                  <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '3px 0 0' }}>{selectedBook.author}</p>
                </div>
                <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--sp-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {error && <p style={{ color: '#f15e6c', fontSize: 12, margin: 0 }}>{error}</p>}

              <button
                onClick={handleMatch}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 0', background: loading ? 'var(--sp-border)' : 'var(--sp-green)',
                  border: 'none', borderRadius: 24, color: loading ? 'var(--sp-text)' : '#000',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--sp-green-hover)'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--sp-green)'; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--sp-text)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Analysing your taste profile...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Are We a Match?
                  </>
                )}
              </button>
            </div>
          )}

          {!selectedBook && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--sp-muted)' }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" style={{ marginBottom: 12, opacity: 0.4 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p style={{ fontSize: 14, margin: 0 }}>Search for a book to check compatibility</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Result card */}
          <div style={{ background: 'var(--sp-surface)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {result.book.coverUrl && <img src={result.book.coverUrl} alt="" style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4 }} />}
              <div>
                <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 14, margin: 0 }}>{result.book.title}</p>
                <p style={{ color: 'var(--sp-text)', fontSize: 12, margin: '3px 0 0' }}>{result.book.author}</p>
              </div>
            </div>
            <MatchGauge percentage={result.percentage} />
          </div>

          {/* Explanation */}
          <div style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: 16 }}>
            <p style={{ color: 'var(--sp-green)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 8px' }}>Why this match?</p>
            <p style={{ color: 'var(--sp-text)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.explanation}</p>
          </div>

          {/* Add to TBR */}
          <button
            onClick={() => onAddToTbr(result.book)}
            disabled={isInTbr(result.book.key)}
            style={{
              width: '100%', padding: '13px 0',
              background: isInTbr(result.book.key) ? 'transparent' : 'var(--sp-elevated)',
              border: isInTbr(result.book.key) ? '1px solid var(--sp-green)' : '1px solid var(--sp-border)',
              borderRadius: 24, color: isInTbr(result.book.key) ? 'var(--sp-green)' : 'var(--sp-white)',
              fontSize: 13, fontWeight: 600, cursor: isInTbr(result.book.key) ? 'default' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isInTbr(result.book.key) ? (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Added to TBR
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Add to TBR
              </>
            )}
          </button>

          {/* Feedback */}
          <div style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: 16 }}>
            <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>Coach the Matchmaker</p>
            <p style={{ color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: '0 0 12px' }}>
              Do you agree with this assessment? Your feedback helps the algorithm better understand your taste.
            </p>

            {/* Agree / Disagree */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { value: true, label: 'Agree', icon: '👍' },
                { value: false, label: 'Disagree', icon: '👎' },
              ].map(({ value, label, icon }) => {
                const active = feedbackAgrees === value;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setFeedbackAgrees(active ? null : value); setFeedbackSaved(false); }}
                    style={{
                      flex: 1, padding: '9px 0',
                      background: active ? (value ? 'rgba(29,185,84,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--sp-elevated)',
                      border: `1px solid ${active ? (value ? 'var(--sp-green)' : '#ef4444') : 'var(--sp-border)'}`,
                      borderRadius: 8, color: active ? (value ? 'var(--sp-green)' : '#ef4444') : 'var(--sp-text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{icon}</span> {label}
                  </button>
                );
              })}
            </div>

            {/* Note */}
            <textarea
              value={feedbackNote}
              onChange={(e) => { setFeedbackNote(e.target.value); setFeedbackSaved(false); }}
              placeholder="Optional: tell the Matchmaker why you agree or disagree, or what it missed..."
              rows={3}
              style={{
                width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)',
                border: '1px solid var(--sp-border)', borderRadius: 6, padding: '8px 10px',
                fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')}
            />

            <button
              onClick={handleSaveFeedback}
              disabled={feedbackAgrees === null && !feedbackNote.trim()}
              style={{
                marginTop: 10, width: '100%', padding: '11px 0',
                background: feedbackSaved ? 'transparent' : 'var(--sp-green)',
                border: feedbackSaved ? '1px solid var(--sp-green)' : 'none',
                borderRadius: 24, color: feedbackSaved ? 'var(--sp-green)' : '#000',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: (feedbackAgrees === null && !feedbackNote.trim()) ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
              }}
            >
              {feedbackSaved ? (
                <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Feedback saved</>
              ) : 'Save Feedback'}
            </button>
          </div>

          <button
            onClick={handleReset}
            style={{ width: '100%', padding: '12px 0', background: 'none', border: '1px solid var(--sp-border)', borderRadius: 24, color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
          >
            Try Another Book
          </button>
        </div>
      )}
      {/* Batch results */}
      {batchResults.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: 'var(--sp-white)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              Batch Match Reports
              {batchRunning && (
                <span style={{ marginLeft: 8, display: 'inline-block', width: 12, height: 12, border: '2px solid var(--sp-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle' }} />
              )}
            </h3>
            {!batchRunning && (
              <button onClick={() => setBatchResults([])} style={{ background: 'none', border: 'none', color: 'var(--sp-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {batchResults.map((r, idx) => {
              const green = '#1DB954', amber = '#f59e0b', red = '#ef4444';
              const pct = r.percentage;
              const pctColor = pct !== undefined ? (pct >= 75 ? green : pct >= 50 ? amber : red) : 'var(--sp-muted)';
              return (
                <div key={idx} style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: '14px 16px' }}>
                  {/* Book header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: r.status === 'done' ? 10 : 0 }}>
                    {r.book.coverUrl && <img src={r.book.coverUrl} alt="" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.book.title}</p>
                      <p style={{ color: 'var(--sp-text)', fontSize: 11, margin: '2px 0 0' }}>{r.book.author}</p>
                    </div>
                    {r.status === 'running' && (
                      <div style={{ width: 16, height: 16, border: '2px solid var(--sp-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    )}
                    {r.status === 'pending' && (
                      <span style={{ color: 'var(--sp-muted)', fontSize: 11, flexShrink: 0 }}>Queued</span>
                    )}
                    {r.status === 'done' && pct !== undefined && (
                      <span style={{ color: pctColor, fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{pct}%</span>
                    )}
                    {r.status === 'error' && (
                      <span style={{ color: '#f15e6c', fontSize: 11, flexShrink: 0 }}>Error</span>
                    )}
                  </div>
                  {r.status === 'done' && r.explanation && (() => {
                    const expanded = batchExpanded.has(idx);
                    return (
                      <div style={{ marginBottom: 10 }}>
                        <p style={{
                          color: 'var(--sp-text)', fontSize: 12, lineHeight: 1.5, margin: 0,
                          ...(!expanded ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
                        }}>{r.explanation}</p>
                        <button
                          onClick={() => setBatchExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx); else next.add(idx);
                            return next;
                          })}
                          style={{ background: 'none', border: 'none', color: 'var(--sp-green)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '4px 0 0', fontFamily: 'inherit' }}
                        >
                          {expanded ? 'Show less' : 'Read more'}
                        </button>
                      </div>
                    );
                  })()}
                  {r.status === 'done' && (
                    <button
                      onClick={() => onAddToTbr(r.book)}
                      disabled={isInTbr(r.book.key)}
                      style={{
                        width: '100%', padding: '9px 0',
                        background: 'transparent',
                        border: `1px solid ${isInTbr(r.book.key) ? 'var(--sp-green)' : 'var(--sp-border)'}`,
                        borderRadius: 20, color: isInTbr(r.book.key) ? 'var(--sp-green)' : 'var(--sp-text)',
                        fontSize: 12, fontWeight: 600, cursor: isInTbr(r.book.key) ? 'default' : 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      {isInTbr(r.book.key) ? (
                        <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Added to TBR</>
                      ) : (
                        <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>Add to TBR</>
                      )}
                    </button>
                  )}
                  {r.status === 'error' && (
                    <p style={{ color: '#f15e6c', fontSize: 11, margin: '6px 0 0' }}>{r.errorMsg}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Previous Matches */}
      {matchHistory.length > 0 && (
        <section style={{ marginTop: 8 }}>
          <h3 style={{ color: 'var(--sp-white)', fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Previous Matches</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matchHistory.map((entry) => {
              const green = '#1DB954', amber = '#f59e0b', red = '#ef4444';
              const pctColor = entry.percentage >= 75 ? green : entry.percentage >= 50 ? amber : red;
              const feedback = matchFeedback.find((f) => f.bookKey === entry.book.key);
              const date = new Date(entry.createdAt);
              const now = Date.now();
              const diffMs = now - date.getTime();
              const diffDays = Math.floor(diffMs / 86400000);
              const dateLabel = diffDays === 0 ? 'Today'
                : diffDays === 1 ? 'Yesterday'
                : diffDays < 7 ? `${diffDays}d ago`
                : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

              return (
                <div key={entry.id} style={{ background: 'var(--sp-surface)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Cover */}
                  <div style={{ flexShrink: 0, width: 40, height: 56, background: 'var(--sp-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    {entry.book.coverUrl
                      ? <img src={entry.book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" fill="none" stroke="var(--sp-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <p style={{ color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.book.title}</p>
                      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: pctColor }}>{entry.percentage}%</span>
                    </div>
                    <p style={{ color: 'var(--sp-text)', fontSize: 11, margin: '0 0 6px' }}>{entry.book.author}</p>
                    {(() => {
                      const expanded = historyExpanded.has(entry.id);
                      const inTbr = isInTbr(entry.book.key);
                      return (
                        <>
                          <p style={{
                            color: 'var(--sp-text)', fontSize: 11, lineHeight: 1.5, margin: 0,
                            ...(!expanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
                          }}>{entry.explanation}</p>

                          {/* Footer row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                            {/* Left: date + feedback + read more */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--sp-muted)', fontSize: 10 }}>{dateLabel}</span>
                              {feedback && feedback.agrees !== null && (
                                <span style={{ fontSize: 10, color: feedback.agrees ? green : red }}>
                                  {feedback.agrees ? '👍' : '👎'}
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setHistoryExpanded((prev) => { const next = new Set(prev); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; }); }}
                                style={{ background: 'none', border: 'none', color: 'var(--sp-green)', fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                              >
                                {expanded ? 'Show less' : 'Read more'}
                              </button>
                            </div>

                            {/* Right: compact TBR button */}
                            <button
                              onClick={() => onAddToTbr(entry.book)}
                              disabled={inTbr}
                              style={{
                                flexShrink: 0, padding: '4px 10px',
                                background: 'transparent',
                                border: `1px solid ${inTbr ? 'var(--sp-green)' : 'var(--sp-border)'}`,
                                borderRadius: 12, color: inTbr ? 'var(--sp-green)' : 'var(--sp-text)',
                                fontSize: 10, fontWeight: 600, cursor: inTbr ? 'default' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              {inTbr ? (
                                <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>In TBR</>
                              ) : (
                                <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>Add to TBR</>
                              )}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
