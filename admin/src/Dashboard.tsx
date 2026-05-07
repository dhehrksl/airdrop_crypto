import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchStats, type Stats } from './api';

const C = {
  bg: '#0B0F19',
  surface: '#141A2A',
  border: '#262E45',
  text: '#E8ECF4',
  muted: '#8A93A6',
  accent: '#5B8DEF',
  good: '#46C28C',
  warn: '#F2B141',
  bad: '#E5556B',
};

const PIE_COLORS = [C.accent, C.good, C.warn, C.bad, '#9B7CFF', '#7DD8E0', '#FF8C66'];

export default function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const s = await fetchStats(token);
        if (alive) {
          setStats(s);
          setError(null);
        }
      } catch (e: any) {
        if (alive) setError(e?.response?.status === 401 ? '토큰이 잘못되었습니다.' : '데이터 로드 실패');
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  if (error) {
    return (
      <Layout onLogout={onLogout}>
        <div style={{ padding: 24, color: C.bad }}>{error}</div>
      </Layout>
    );
  }
  if (!stats) {
    return (
      <Layout onLogout={onLogout}>
        <div style={{ padding: 24, color: C.muted }}>로딩 중...</div>
      </Layout>
    );
  }

  const bucketLabels: Record<string, string> = {
    '0': '0–49',
    '50': '50–69',
    '70': '70–79',
    '80': '80–89',
    '90': '90–94',
    '95': '95+',
  };
  const bucketData = stats.trust_buckets.map((b) => ({
    name: bucketLabels[String(b._id)] || String(b._id),
    count: b.count,
  }));

  const catData = stats.by_category.map((c) => ({
    name: c._id || 'Other',
    value: c.count,
    avg: Math.round(c.avgScore || 0),
  }));

  const last7 = stats.last7.map((d) => ({
    date: d._id.slice(5),
    count: d.count,
    avg: Math.round(d.avgScore || 0),
  }));

  return (
    <Layout onLogout={onLogout}>
      <div style={styles.summaryRow}>
        <Stat label="총 에어드랍" value={stats.summary.total.toLocaleString()} />
        <Stat label="진행중" value={stats.summary.active.toLocaleString()} />
        <Stat label="푸시 구독자" value={stats.summary.push_subscribers.toLocaleString()} />
      </div>

      <div style={styles.grid}>
        <Card title="신뢰도 분포">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bucketData}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke={C.muted} />
              <YAxis stroke={C.muted} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}` }} />
              <Bar dataKey="count" fill={C.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="카테고리별 비중">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={catData} dataKey="value" outerRadius={90} label>
                {catData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}` }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="최근 7일 적재량 + 평균 신뢰도" wide>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={last7}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={C.muted} />
              <YAxis yAxisId="left" stroke={C.muted} />
              <YAxis yAxisId="right" orientation="right" stroke={C.warn} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}` }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke={C.accent} strokeWidth={2} name="건수" />
              <Line yAxisId="right" type="monotone" dataKey="avg" stroke={C.warn} strokeWidth={2} name="평균 신뢰도" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="최근 적재 항목" wide>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>제목</th>
                <th style={styles.th}>카테고리</th>
                <th style={styles.th}>신뢰도</th>
                <th style={styles.th}>적재 시각</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((r) => (
                <tr key={r._id}>
                  <td style={styles.td}>{r.title}</td>
                  <td style={styles.td}>{r.category}</td>
                  <td style={{ ...styles.td, color: scoreColor(r.trust_score), fontWeight: 700 }}>{r.trust_score}</td>
                  <td style={styles.td}>{new Date(r.created_at).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="알림 발송 현황">
          <ul style={{ paddingLeft: 18, color: C.text, lineHeight: 1.8 }}>
            {stats.notifications.length === 0 ? <li style={{ color: C.muted }}>발송 이력 없음</li> : null}
            {stats.notifications.map((n) => (
              <li key={n._id}>
                {n._id === 'high_trust' ? '고신뢰도 알림' : '마감 임박 알림'}: {n.count}건 (총 {n.totalSent} 디바이스)
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Layout>
  );
}

function scoreColor(s: number) {
  if (s >= 90) return C.good;
  if (s >= 80) return C.warn;
  return C.bad;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statBox}>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color: C.text, fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Card({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ ...styles.card, gridColumn: wide ? 'span 2' : 'span 1' }}>
      <div style={styles.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0, color: C.text }}>Airdrop Crypto · Admin</h1>
        <button onClick={onLogout} style={styles.logoutBtn}>
          로그아웃
        </button>
      </div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 },
  statBox: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: { color: C.text, fontWeight: 700, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse', color: C.text, fontSize: 13 },
  th: { textAlign: 'left', color: C.muted, fontWeight: 600, padding: '8px 6px', borderBottom: `1px solid ${C.border}` },
  td: { padding: '8px 6px', borderBottom: `1px solid ${C.border}` },
  logoutBtn: {
    background: 'transparent',
    color: C.muted,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
  },
};
