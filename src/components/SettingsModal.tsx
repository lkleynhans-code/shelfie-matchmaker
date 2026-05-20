import { useState } from 'react';
import { DEFAULT_MODEL } from '../store/useProfileStore';

interface Props {
  apiKey: string;
  baseUrl: string;
  model: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyMarket: string;
  onSave: (values: {
    apiKey: string; baseUrl: string; model: string;
    spotifyClientId: string; spotifyClientSecret: string; spotifyMarket: string;
  }) => void;
  onClose: () => void;
}

function SpField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--sp-text)', fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ color: 'var(--sp-muted)', fontSize: 11, margin: '5px 0 0', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--sp-elevated)', color: 'var(--sp-white)',
  border: '1px solid var(--sp-border)', borderRadius: 6, padding: '10px 12px',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
};

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 36 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')}
      />
      <button type="button" onClick={() => setVisible(!visible)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sp-muted)', cursor: 'pointer', padding: 2 }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {visible
            ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
            : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
          }
        </svg>
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p style={{ color: 'var(--sp-green)', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '20px 0 14px', borderTop: '1px solid var(--sp-border)', paddingTop: 16 }}>{children}</p>;
}

export default function SettingsModal({ apiKey, baseUrl, model, spotifyClientId, spotifyClientSecret, spotifyMarket, onSave, onClose }: Props) {
  const [draftKey, setDraftKey] = useState(apiKey);
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const [draftModel, setDraftModel] = useState(model || DEFAULT_MODEL);
  const [draftSpotifyId, setDraftSpotifyId] = useState(spotifyClientId);
  const [draftSpotifySecret, setDraftSpotifySecret] = useState(spotifyClientSecret);
  const [draftSpotifyMarket, setDraftSpotifyMarket] = useState(spotifyMarket || 'US');

  function handleSave() {
    onSave({ apiKey: draftKey.trim(), baseUrl: draftUrl.trim(), model: draftModel.trim() || DEFAULT_MODEL, spotifyClientId: draftSpotifyId.trim(), spotifyClientSecret: draftSpotifySecret.trim(), spotifyMarket: draftSpotifyMarket.trim().toUpperCase() || 'US' });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: 'var(--sp-surface)', borderRadius: '16px 16px 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--sp-border)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 14px', borderBottom: '1px solid var(--sp-border)' }}>
          <p style={{ color: 'var(--sp-white)', fontWeight: 700, fontSize: 16, margin: 0 }}>Settings</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sp-text)', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 16px 16px' }}>
          <SectionLabel>Spotify Audiobooks</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SpField label="Client ID">
              <input type="text" value={draftSpotifyId} onChange={(e) => setDraftSpotifyId(e.target.value)} placeholder="From developer.spotify.com/dashboard" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')} />
            </SpField>
            <SpField label="Client Secret" hint="Stored only in your browser's local storage.">
              <SecretInput value={draftSpotifySecret} onChange={setDraftSpotifySecret} placeholder="Your Spotify app client secret" />
            </SpField>
            <SpField label="Market" hint="2-letter country code, e.g. US, GB, ZA, AU.">
              <input type="text" value={draftSpotifyMarket} onChange={(e) => setDraftSpotifyMarket(e.target.value)} placeholder="US" maxLength={2} style={{ ...inputStyle, width: 72, textTransform: 'uppercase' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')} />
            </SpField>
          </div>

          <SectionLabel>AI Matchmaker</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SpField label="API Key" hint="Stored only in your browser's local storage.">
              <SecretInput value={draftKey} onChange={setDraftKey} placeholder="sk-... or your proxy API key" />
            </SpField>
            <SpField label="Base URL" hint="Leave blank to use OpenAI directly. For proxies, both apikey and Authorization headers are sent.">
              <input type="text" value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="https://your-proxy.example.com/v1" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')} />
            </SpField>
            <SpField label="Model" hint="e.g. gpt-4o-mini, gpt-4o, or your proxy's model name.">
              <input type="text" value={draftModel} onChange={(e) => setDraftModel(e.target.value)} placeholder={DEFAULT_MODEL} style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sp-green)')} onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sp-border)')} />
            </SpField>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid var(--sp-border)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: 'none', border: '1px solid var(--sp-border)', borderRadius: 24, color: 'var(--sp-white)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: '12px 0', background: 'var(--sp-green)', border: 'none', borderRadius: 24, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-green-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sp-green)')}>Save</button>
        </div>
      </div>
    </div>
  );
}
