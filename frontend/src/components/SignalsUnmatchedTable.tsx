// frontend/src/components/SignalsUnmatchedTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

type Suggestion = {
  requestId: number;
  score: number;
  reasons: string[];
  vessel_name?: string | null;
  mmsi?: string | null;
  imo_number?: string | null;
  planned_test_date?: string | null;
  timeDiffHours?: number;
};

type FeedItem = {
  id: number;
  received_at: string;
  terminal_number?: string | null;
  vessel_name?: string | null;
  mmsi?: string | null;
  operator_messages?: string[];
  suggestions: Suggestion[];
  topScore?: number;
};

type FeedResponse = { count: number; items: FeedItem[] };

export function SignalsUnmatchedTable() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [sort, setSort] = useState<'score'|'time'>('score');
  const [dir, setDir] = useState<'asc'|'desc'>('desc');

  const fetchFeed = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<FeedResponse>(`/signals/unmatched?sort=${sort}&dir=${dir}&limit=100`);
      setItems(res.items);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, [sort, dir]);

  const rows = useMemo(() => items, [items]);

  const link = async (sigId: number, reqId: number) => {
    await api.post(`/signals/${sigId}/link`, { requestId: reqId });
    const evt = new CustomEvent('toast', { detail: { type: 'success', message: `Связано: сигнал #${sigId} → заявка #${reqId}` } });
    window.dispatchEvent(evt);
    await fetchFeed();
  };

  return (
    <div data-testid="unmatched-panel">
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <strong>Непривязанные сигналы</strong>
        <label>Сортировка:&nbsp;
          <select value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="score">по score</option>
            <option value="time">по времени</option>
          </select>
        </label>
        <label>Направление:&nbsp;
          <select value={dir} onChange={e => setDir(e.target.value as any)}>
            <option value="desc">убыв.</option>
            <option value="asc">возр.</option>
          </select>
        </label>
        <button onClick={fetchFeed}>Обновить</button>
      </div>

      {loading && <div>Загрузка…</div>}
      {error && <div role="alert">{error}</div>}

      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th>ID</th>
            <th>UTC</th>
            <th>IMN</th>
            <th>Судно</th>
            <th>MMSI</th>
            <th>Подсказки</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} data-testid={`signal-${r.id}`} data-signal-id={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.received_at).toISOString()}</td>
              <td>{r.terminal_number || '—'}</td>
              <td>{r.vessel_name || '—'}</td>
              <td>{r.mmsi || '—'}</td>
              <td>
                {r.suggestions?.length ? (
                  <ul style={{margin:0, paddingLeft:16}}>
                    {r.suggestions.map(s => (
                      <li key={s.requestId}>
                        #{s.requestId} (score {s.score}; {s.reasons.join('+')})
                      </li>
                    ))}
                  </ul>
                ) : '—'}
              </td>
              <td>
                {r.suggestions?.[0] ? (
                  <button
                    data-testid={`link-${r.id}-${r.suggestions[0].requestId}`}
                    data-action="link"
                    aria-label="Связать"
                    onClick={() => link(r.id, r.suggestions[0].requestId)}
                  >
                    Связать
                  </button>
                ) : <em>Нет кандидатов</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SignalsUnmatchedTable;
// pad 0
