import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Cloud, Flame, ScanSearch } from 'lucide-react';
import { DOMAIN_RE, errorText, toolkit } from '../../api';
import { Button, Modal, Segmented } from '../ui';

const MODULES = [
  ['fireStarter', 'Fire-Starter', 'Subdomain scraping, brute force, DNS, httprobe', 14, Flame],
  ['fireCloud', 'Fire-Cloud', 'AWS, Azure and GCP asset discovery', 8, Cloud],
  ['fireScanner', 'Fire-Scanner', 'Nuclei templates against live hosts', 12, ScanSearch],
];

export default function WildfireModal({ open, onClose, target, targets, onStarted }) {
  const [mods, setMods] = useState({ fireStarter: true, fireCloud: false, fireScanner: false });
  const [scope, setScope] = useState('single');
  const [busy, setBusy] = useState(false);

  const list = scope === 'single' ? (target ? [target.fqdn] : []) : targets.map((t) => t.fqdn);
  // toolkit-service.py puts the FQDN into a shell command, so refuse anything that isn't a plain domain.
  const invalid = list.filter((d) => !DOMAIN_RE.test(d));
  const steps = MODULES.reduce((n, [k, , , s]) => n + (mods[k] ? s : 0), 0) * Math.max(1, list.length);

  const start = () => {
    setBusy(true);
    const payload = { ...mods, fqdn: target?.fqdn || '', scanSingleDomain: scope === 'single', domainCount: scope === 'single' ? 1 : targets.length };
    // The request stays open until Wildfire finishes; progress comes from /status polling.
    toolkit.post('/wildfire', payload)
      .then((res) => {
        if (String(res.data?.message || '').startsWith('ERROR')) toast.error(res.data.message);
        else toast.success('Wildfire finished');
      })
      .catch((err) => toast.error(errorText(err, 'Wildfire failed')));
    window.setTimeout(() => { setBusy(false); onStarted(); onClose(); toast('Wildfire started'); }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title="Run Wildfire"
      description="Runs toolkit/wildfire.py through the toolkit service on port 5000."
      footer={<>
        <span className="b-foot-note">{steps} steps</span>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={start} disabled={busy || !steps || !list.length || invalid.length > 0}>{busy ? 'Starting…' : 'Start'}</Button>
      </>}
    >
      <div className="b-field">
        <span className="b-field-label">Scope</span>
        <Segmented value={scope} onChange={setScope} options={[{ value: 'single', label: target ? target.fqdn : 'Selected target' }, { value: 'all', label: 'All targets', count: targets.length }]} />
      </div>
      <div className="b-modules">
        {MODULES.map(([key, name, text, n, Icon]) => (
          <label key={key} className={`b-module ${mods[key] ? 'on' : ''}`}>
            <input type="checkbox" checked={mods[key]} onChange={(e) => setMods((m) => ({ ...m, [key]: e.target.checked }))} />
            <span className="b-module-icon"><Icon size={16} /></span>
            <span className="b-module-copy"><strong>{name}</strong><small>{text}</small></span>
            <span className="b-module-steps">{n} steps</span>
          </label>
        ))}
      </div>
      {invalid.length > 0 && <p className="b-field-error">Not a plain domain, so it won't be sent to the toolkit: {invalid.join(', ')}</p>}
      <p className="b-callout"><AlertTriangle size={15} /> Only scan systems you own or are explicitly authorized to test.</p>
    </Modal>
  );
}
