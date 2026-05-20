import { useState, useMemo } from 'react';
import type { AppView, ProfileEntry } from './types';
import { DEFAULT_RATINGS } from './types';
import { useProfileStore } from './store/useProfileStore';
import ProfileView from './components/ProfileView';
import TbrView from './components/TbrView';
import MatchmakerView from './components/MatchmakerView';
import ReaderProfileView from './components/ReaderProfileView';
import RatingModal from './components/RatingModal';
import SettingsModal from './components/SettingsModal';


function NavIcon({ id, active }: { id: AppView; active: boolean }) {
  const color = active ? 'var(--sp-white)' : 'var(--sp-muted)';
  const sw = active ? 2.5 : 2;
  if (id === 'profile') return (
    <svg width="24" height="24" fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
  if (id === 'tbr') return (
    <svg width="24" height="24" fill={active ? color : 'none'} stroke={color} strokeWidth={sw} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
  if (id === 'matchmaker') return (
    <svg width="24" height="24" fill={active ? color : 'none'} stroke={color} strokeWidth={sw} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
  // reader
  return (
    <svg width="24" height="24" fill="none" stroke={color} strokeWidth={sw} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function App() {
  const {
    profile, tbr, readerProfile, matchFeedback, matchHistory, apiKey, baseUrl, model,
    spotifyClientId, spotifyClientSecret, spotifyMarket,
    setApiKey, setBaseUrl, setModel,
    setSpotifyClientId, setSpotifyClientSecret, setSpotifyMarket,
    setReaderProfile, upsertFeedback, addToHistory,
    addBook, updateRatings, removeBook, isInProfile,
    addToTbr, removeFromTbr, isInTbr, promoteFromTbr,
  } = useProfileStore();

  const [view, setView] = useState<AppView>('profile');
  const [editingEntry, setEditingEntry] = useState<ProfileEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ProfileEntry | null>(null);
  const [pendingTbrId, setPendingTbrId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const searchConfig = useMemo(() => ({
    spotify: spotifyClientId && spotifyClientSecret
      ? { clientId: spotifyClientId, clientSecret: spotifyClientSecret, market: spotifyMarket }
      : undefined,
  }), [spotifyClientId, spotifyClientSecret, spotifyMarket]);

  const visionConfig = useMemo(() => (
    apiKey ? { apiKey, baseUrl: baseUrl || undefined, model: model || undefined } : undefined
  ), [apiKey, baseUrl, model]);

  function handleAddBook(book: Parameters<typeof addBook>[0]) {
    if (isInProfile(book.key)) return;
    const entry = addBook(book);
    setEditingEntry(entry);
  }

  function handleMoveToBookshelf(tbrEntryId: string) {
    // Open the rating modal with a temporary entry — only promote on save
    const tbrEntry = tbr.find((e) => e.id === tbrEntryId);
    if (!tbrEntry) return;
    const tempEntry: ProfileEntry = {
      id: crypto.randomUUID(),
      book: tbrEntry.book,
      ratings: structuredClone(DEFAULT_RATINGS),
      addedAt: new Date().toISOString(),
    };
    setPendingTbrId(tbrEntryId);
    setEditingEntry(tempEntry);
  }

  const tabs: { id: AppView; label: string; locked?: boolean }[] = [
    { id: 'profile', label: 'Bookshelf' },
    { id: 'tbr', label: 'TBR' },
    { id: 'matchmaker', label: 'Matchmaker' },
    { id: 'reader', label: 'My Profile' },
  ];

  return (
    <div style={{ background: 'var(--sp-bg)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone-width content column */}
      <div style={{ width: '100%', maxWidth: 430, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Top header */}
        <header style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--sp-green)">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.759-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.72a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.793c3.532-1.072 9.404-.865 13.115 1.338a.937.937 0 11-.955 1.614z"/>
            </svg>
            <span style={{ color: 'var(--sp-white)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
              Shelfie Matchmaker
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--sp-text)', display: 'flex' }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Main scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', paddingBottom: 'calc(var(--sp-nav-height) + 16px)' }}>
          {view === 'profile' && (
            <ProfileView
              profile={profile}
              onAddBook={handleAddBook}
              onViewRatings={setViewingEntry}
              onEditRatings={setEditingEntry}
              onRemoveBook={removeBook}
              isInProfile={isInProfile}
              searchConfig={searchConfig}
              visionConfig={visionConfig}
            />
          )}
          {view === 'tbr' && (
            <TbrView
              tbr={tbr}
              onAddToTbr={addToTbr}
              onRemoveFromTbr={removeFromTbr}
              onMoveToBookshelf={handleMoveToBookshelf}
              isInTbr={isInTbr}
              isInProfile={isInProfile}
              searchConfig={searchConfig}
              visionConfig={visionConfig}
            />
          )}
          {view === 'matchmaker' && (
            <MatchmakerView
              profile={profile}
              readerProfile={readerProfile}
              apiKey={apiKey}
              baseUrl={baseUrl}
              model={model}
              searchConfig={searchConfig}
              visionConfig={visionConfig}
              matchFeedback={matchFeedback}
              matchHistory={matchHistory}
              onNeedApiKey={() => setShowSettings(true)}
              onAddToTbr={addToTbr}
              isInTbr={isInTbr}
              onFeedback={upsertFeedback}
              onSaveHistory={addToHistory}
            />
          )}
          {view === 'reader' && (
            <ReaderProfileView
              readerProfile={readerProfile}
              onChange={setReaderProfile}
            />
          )}
        </main>

        {/* Bottom nav bar */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          height: 'var(--sp-nav-height)',
          background: '#000000',
          borderTop: '1px solid var(--sp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 8,
          zIndex: 50,
        }}>
          {tabs.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 20px',
                }}
              >
                <NavIcon id={tab.id} active={active} />
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--sp-white)' : 'var(--sp-muted)',
                  letterSpacing: '0.2px',
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {viewingEntry && !editingEntry && (
        <RatingModal
          entry={viewingEntry}
          readOnly
          onSave={(id, ratings) => updateRatings(id, ratings)}
          onEdit={() => { setEditingEntry(viewingEntry); setViewingEntry(null); }}
          onClose={() => setViewingEntry(null)}
        />
      )}
      {editingEntry && (
        <RatingModal
          entry={editingEntry}
          onSave={(id, ratings) => {
            if (pendingTbrId) {
              // Promote from TBR on save, using the temp entry's id
              const promoted = promoteFromTbr(pendingTbrId);
              if (promoted) updateRatings(promoted.id, ratings);
              setPendingTbrId(null);
            } else {
              updateRatings(id, ratings);
            }
          }}
          onClose={() => {
            setEditingEntry(null);
            setPendingTbrId(null); // cancel — book stays in TBR
          }}
        />
      )}
      {showSettings && (
        <SettingsModal
          apiKey={apiKey} baseUrl={baseUrl} model={model}
          spotifyClientId={spotifyClientId} spotifyClientSecret={spotifyClientSecret} spotifyMarket={spotifyMarket}
          onSave={(v) => { setApiKey(v.apiKey); setBaseUrl(v.baseUrl); setModel(v.model); setSpotifyClientId(v.spotifyClientId); setSpotifyClientSecret(v.spotifyClientSecret); setSpotifyMarket(v.spotifyMarket); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
