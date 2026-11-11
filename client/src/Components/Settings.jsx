import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Download, Plus, Trash2, Upload } from 'lucide-react';
import { api, ENDPOINTS, errorText, MOCK_MODE, toolkit } from '../api';
import { importScanFile } from './Modals/AddFqdnModal';
import { Badge, Button, Card, PageHeader } from './ui';

const stamp = () => new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');

export default function Settings({ targets, active, setActive, refresh, openAdd, services }) {
  const [fileName, setFileName] = useState(`bounty-hawk_${stamp()}`);
  const [busy, setBusy] = useState('');
  const [checks, setChecks] = useState({});
  const fileRef = useRef(null);

  const remove = async (t) => {
    if (!window.confirm(`Delete ${t.fqdn} and all of its recon and scan data? This cannot be undone.`)) return;
    setBusy(t._id);
    try {
      await api.post('/api/fqdn/delete', { _id: t._id });
      toast.success(`${t.fqdn} deleted`);
      await refresh();
    } catch (err) {
      toast.error(errorText(err, 'Delete failed'));
    } finally {
      setBusy('');
    }
  };

  const exportAll = async () => {
    try {
      const { data } = await api.post('/api/fqdn/all', {});
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.replace(/[^\w.-]+/g, '_') || 'bounty-hawk'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorText(err, 'Export failed'));
    }
  };

  const importFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy('import');
      try {
        const { created, updated } = await importScanFile(JSON.parse(String(reader.result)), targets);
        toast.success(`${created} created, ${updated} updated`);
        await refresh();
      } catch (err) {
        toast.error(err.response ? errorText(err, 'Import failed') : err.message);
      } finally {
        setBusy('');
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const screenshots = async () => {
    if (!window.confirm('Collect screenshots of every live URL? wildfire.py --screenshots will visit each one.')) return;
    setBusy('shots');
    toast('Collecting screenshots…');
    try {
      await toolkit.post('/collect_sceenshots', {});
      toast.success('Screenshots collected');
    } catch (err) {
      toast.error(errorText(err, 'Screenshot collection failed'));
    } finally {
      setBusy('');
    }
  };

  const test = async (name, call) => {
    const t0 = performance.now();
    setChecks((c) => ({ ...c, [name]: 'Testing…' }));
    try { await call(); setChecks((c) => ({ ...c, [name]: `OK · ${Math.round(performance.now() - t0)} ms` })); }
    catch (err) { setChecks((c) => ({ ...c, [name]: errorText(err, 'No response') })); }
  };

  return (
    <div className="b-page">
      <PageHeader title="Settings" description="Targets, data, services and the API map." />

      <Card title="Targets" subtitle={`${targets.length} stored on the server`} flush action={<Button size="sm" variant="primary" onClick={openAdd}><Plus size={13} /> Add target</Button>}>
        {targets.length ? (
          <ul className="b-list">
            {targets.map((t) => (
              <li key={t._id}>
                <span className="b-avatar">{t.fqdn[0]?.toUpperCase()}</span>
                <span className="b-list-main"><strong className="mono">{t.fqdn}</strong><small>{t.recon?.subdomains?.consolidated?.length || 0} subdomains · {t.recon?.subdomains?.httprobe?.length || 0} live</small></span>
                {t._id === active?._id ? <Badge tone="blue">Selected</Badge> : <Button size="sm" variant="ghost" onClick={() => setActive(t._id)}>Select</Button>}
                <Button size="sm" variant="ghost" className="b-danger-text" onClick={() => remove(t)} disabled={busy === t._id} aria-label={`Delete ${t.fqdn}`}><Trash2 size={14} /></Button>
              </li>
            ))}
          </ul>
        ) : <div className="b-card-empty">No targets yet.</div>}
      </Card>

      <div className="b-grid b-grid-2">
        <Card title="Export" subtitle="Every target document as one JSON file">
          <div className="b-field">
            <label className="b-field-label" htmlFor="exportName">File name</label>
            <div className="b-input-row"><input id="exportName" className="b-input mono" value={fileName} onChange={(e) => setFileName(e.target.value)} /><span className="muted">.json</span></div>
          </div>
          <Button onClick={exportAll} disabled={!targets.length}><Download size={14} /> Export data</Button>
        </Card>
        <Card title="Import" subtitle="A previous Bounty Hawk export. Matching targets are overwritten.">
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()} disabled={busy === 'import'}><Upload size={14} /> {busy === 'import' ? 'Importing…' : 'Choose file'}</Button>
        </Card>
      </div>

      <Card title="Screenshots" subtitle="Runs wildfire.py --screenshots and saves PNGs to client/public/screenshots, which Enumeration shows.">
        <Button onClick={screenshots} disabled={busy === 'shots' || services.toolkit !== 'online'}><Camera size={14} /> {busy === 'shots' ? 'Collecting…' : 'Collect screenshots'}</Button>
      </Card>

      <Card title="Services" subtitle={MOCK_MODE ? 'Mock mode: requests are answered in the browser.' : 'The browser calls this dev server, which proxies to each service.'} flush>
        <ul className="b-list">
          {[['server', 'Express API', '/api → BH_SERVER_URL (default 127.0.0.1:8000)', () => api.get('/api/ping', { timeout: 5000 })], ['toolkit', 'Toolkit service', '/toolkit → BH_TOOLKIT_URL (default 127.0.0.1:5000)', () => toolkit.get('/ping', { timeout: 5000 })]].map(([key, name, where, call]) => (
            <li key={key}>
              <span className={`b-svc b-svc-${services[key]}`}><i /></span>
              <span className="b-list-main"><strong>{name}</strong><small className="mono">{where}</small></span>
              {checks[key] && <span className="b-list-meta">{checks[key]}</span>}
              <Button size="sm" onClick={() => test(key, call)}>Test</Button>
            </li>
          ))}
        </ul>
        <p className="b-card-note">Change the targets in <code>client/.env</code> (see <code>.env.example</code>).</p>
      </Card>

      <Card title="API map" subtitle="Every route the client knows about" flush>
        <div className="b-api-map">
          {Object.entries(ENDPOINTS).map(([service, routes]) => (
            <div key={service}>
              <h3>{service === 'server' ? 'Express API' : 'Toolkit service (via /toolkit)'}</h3>
              <ul>{routes.map(([method, path, what]) => <li key={path}><span className={`b-verb b-verb-${method.toLowerCase()}`}>{method}</span><code>{path}</code><span className="muted">{what}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
