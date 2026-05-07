import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';

const TOKEN_KEY = 'admin_token';

export default function App() {
  const [token, setToken] = useState<string>('');
  const [input, setInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  if (!token) {
    return (
      <div style={styles.center}>
        <div style={styles.loginBox}>
          <h1 style={styles.h1}>Airdrop Crypto · Admin</h1>
          <p style={styles.muted}>관리자 토큰을 입력하세요 (백엔드의 ADMIN_TOKEN 환경변수)</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ADMIN_TOKEN"
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input) {
                localStorage.setItem(TOKEN_KEY, input);
                setToken(input);
              }
            }}
          />
          <button
            style={styles.button}
            onClick={() => {
              if (!input) return;
              localStorage.setItem(TOKEN_KEY, input);
              setToken(input);
            }}
          >
            접속
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard token={token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(''); }} />;
}

const styles: Record<string, React.CSSProperties> = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginBox: {
    width: 360,
    padding: 28,
    background: '#141A2A',
    borderRadius: 12,
    border: '1px solid #262E45',
  },
  h1: { fontSize: 20, marginTop: 0 },
  muted: { color: '#8A93A6', fontSize: 13 },
  input: {
    width: '100%',
    background: '#1B2237',
    border: '1px solid #262E45',
    borderRadius: 8,
    color: '#E8ECF4',
    padding: '10px 12px',
    fontSize: 14,
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    padding: '10px 12px',
    background: '#5B8DEF',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
