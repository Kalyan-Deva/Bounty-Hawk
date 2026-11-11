import React, { useEffect, useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import { api, errorText } from '../api';
import { Button, Empty } from './ui';

export default function Logging() {
  const [logs, setLogs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    api.post('/api/log/all', {})
      .then((res) => {
        const list = [...(res.data || [])].reverse();
        setLogs(list);
        setCurrent((c) => (list.some((l) => l._id === c) ? c : list[0]?._id ?? null));
        setError('');
      })
      .catch((err) => setError(errorText(err, 'Could not load logs')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const log = logs.find((l) => l._id === current);
  const lines = (log?.logFile || []).filter((l) => !query || String(l).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="b-method">
      <aside className="b-steps">
        <div className="b-steps-head">
          <h1>Logs</h1>
          <p>Output the toolkit stored for each scan.</p>
          <Button size="sm" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? 'spin' : ''} /> Reload</Button>
        </div>
        <nav className="b-steps-list">
          {logs.map((l) => (
            <button key={l._id} type="button" className={`b-step ${l._id === current ? 'active' : ''}`} onClick={() => setCurrent(l._id)}>
              <span className="b-step-label">{l.scan || 'Scan'}<small className="b-step-sub">{l.createdAt ? new Date(l.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</small></span>
              <em>{l.logFile?.length || 0}</em>
            </button>
          ))}
          {!loading && !logs.length && <p className="muted b-pad">{error || 'No logs yet.'}</p>}
        </nav>
      </aside>
      <section className="b-work">
        {log ? (
          <>
            <header className="b-work-head row-between">
              <h2>{log.scan || 'Scan'}</h2>
              <input className="b-input b-input-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search output" aria-label="Search log output" />
            </header>
            <pre className="b-console">
              {lines.length ? lines.map((line, i) => {
                const text = String(line);
                const tone = /^\[(!|ERROR)\]/.test(text) ? 'warn' : /^\[-\]/.test(text) ? 'dim' : '';
                return <span key={i} className={tone}><i>{i + 1}</i>{text}{'\n'}</span>;
              }) : 'No matching lines.'}
            </pre>
          </>
        ) : <Empty icon={<ScrollText size={20} />} title={loading ? 'Loading logs…' : 'No log selected'}>{error}</Empty>}
      </section>
    </div>
  );
}
