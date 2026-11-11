import React, { useState } from 'react';
import { FileJson, Upload } from 'lucide-react';
import { api, DOMAIN_RE, errorText, normalizeDomain } from '../../api';
import { Button, Modal, Segmented } from '../ui';

const readJson = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => { try { resolve(JSON.parse(String(reader.result))); } catch { reject(new Error('That file is not valid JSON')); } };
  reader.onerror = () => reject(new Error('The file could not be read'));
  reader.readAsText(file);
});

/** Burp project config -> enabled in-scope hosts. */
function domainsFromBurp(config) {
  const include = config?.target?.scope?.include;
  if (!Array.isArray(include)) throw new Error('No target.scope.include list in this Burp config');
  return [...new Set(include.filter((i) => i.enabled).map((i) => normalizeDomain(String(i.host || '').replace(/[\^$\\]/g, ''))))];
}

export async function importScanFile(data, targets) {
  if (!Array.isArray(data)) throw new Error('A Bounty Hawk export is a JSON array of targets');
  let created = 0;
  let updated = 0;
  for (const doc of data) {
    if (!doc?.fqdn || !DOMAIN_RE.test(normalizeDomain(doc.fqdn))) continue;
    const existing = targets.find((t) => t.fqdn === doc.fqdn);
    if (existing) { await api.post('/api/fqdn/update', { ...doc, _id: existing._id }); updated += 1; }
    else { const { _id, ...rest } = doc; await api.post('/api/fqdn/new', rest); created += 1; }
  }
  return { created, updated };
}

export default function AddFqdnModal({ open, onClose, targets, onDone }) {
  const [mode, setMode] = useState('manual');
  const [domain, setDomain] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setDomain(''); setFile(null); setError(''); };
  const close = () => { if (!busy) { reset(); onClose(); } };

  const create = async (domains) => {
    const fresh = domains.filter((d) => !targets.some((t) => t.fqdn === d));
    const docs = [];
    for (const d of fresh) docs.push((await api.post('/api/fqdn/new', { fqdn: d })).data);
    return docs;
  };

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'manual') {
        const d = normalizeDomain(domain);
        if (!DOMAIN_RE.test(d)) throw new Error('Enter a plain domain such as example.com');
        const docs = await create([d]);
        onDone(docs[0]?.fqdn || d, docs.length ? `${d} added` : `${d} already exists`);
      } else {
        if (!file) throw new Error('Choose a file first');
        const data = await readJson(file);
        if (mode === 'burp') {
          const domains = domainsFromBurp(data);
          const valid = domains.filter((d) => DOMAIN_RE.test(d));
          if (!valid.length) throw new Error('No plain domains in the enabled scope (wildcards and regexes are skipped)');
          const docs = await create(valid);
          const skipped = domains.length - valid.length;
          onDone(valid[0], `${docs.length} target${docs.length === 1 ? '' : 's'} added from Burp scope${skipped ? `, ${skipped} skipped` : ''}`);
        } else {
          const { created, updated } = await importScanFile(data, targets);
          onDone(data[0]?.fqdn, `${created} created, ${updated} updated from scan file`);
        }
      }
      reset();
    } catch (err) {
      setError(err.response ? errorText(err, 'The server rejected it') : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add target"
      description="Stored in MongoDB through the Express API. Only add domains you're authorized to test."
      footer={<><Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button><Button variant="primary" onClick={submit} disabled={busy || (mode === 'manual' ? !domain.trim() : !file)}>{busy ? 'Working…' : mode === 'scan' ? 'Import' : 'Add'}</Button></>}
    >
      <Segmented value={mode} onChange={(m) => { setMode(m); setError(''); setFile(null); }} options={[{ value: 'manual', label: 'Domain' }, { value: 'burp', label: 'Burp scope' }, { value: 'scan', label: 'Scan file' }]} />
      {mode === 'manual' ? (
        <form className="b-field" onSubmit={submit}>
          <label className="b-field-label" htmlFor="manualFqdn">Domain</label>
          <input id="manualFqdn" autoFocus className={`b-input mono ${error ? 'invalid' : ''}`} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          <small>https:// and www. are stripped.</small>
        </form>
      ) : (
        <label className="b-drop">
          {mode === 'burp' ? <FileJson size={20} /> : <Upload size={20} />}
          <strong>{file ? file.name : mode === 'burp' ? 'Choose a Burp Suite project config (.json)' : 'Choose a Bounty Hawk export (.json)'}</strong>
          <small>{mode === 'burp' ? 'Enabled hosts in target.scope.include become targets.' : 'Targets that already exist are updated with the file contents.'}</small>
          <input type="file" accept="application/json,.json" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      )}
      {error && <p className="b-field-error">{error}</p>}
    </Modal>
  );
}
