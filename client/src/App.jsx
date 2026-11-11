import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  BookOpen, Check, ChevronsUpDown, Cloud, Code2, Flame, Globe2, LayoutGrid, Lightbulb, Link2, Menu, Plus, Radar,
  ScrollText, Settings as SettingsIcon, ShieldAlert, Square, X, FlaskConical, AlertTriangle,
} from 'lucide-react';
import { api, errorText, MOCK_MODE, toolkit } from './api';
import Dashboard from './Components/Dashboard';
import Enumeration from './Components/Enumeration';
import Logging from './Components/Logging';
import Settings from './Components/Settings';
import { Chaining, Core, Creative, CveTesting, Ops, Recon, Resources } from './Components/sections';
import AddFqdnModal from './Components/Modals/AddFqdnModal';
import WildfireModal from './Components/Modals/WildfireModal';
import { Button, Empty, IconButton } from './Components/ui';

const NAV = [
  { items: [['dashboard', 'Dashboard', LayoutGrid]] },
  { label: 'Discover', items: [['recon', 'Recon', Radar], ['enumeration', 'Enumeration', Globe2]] },
  { label: 'Test', items: [['cve', 'CVE & Nuclei', ShieldAlert], ['ops', 'Infrastructure', Cloud], ['core', 'Core application', Code2], ['creative', 'Creative', Lightbulb], ['chaining', 'Chaining', Link2]] },
  { label: 'Library', items: [['resources', 'Resources', BookOpen], ['logs', 'Logs', ScrollText]] },
];
const SECTIONS = { dashboard: Dashboard, recon: Recon, enumeration: Enumeration, cve: CveTesting, ops: Ops, core: Core, creative: Creative, chaining: Chaining, resources: Resources, logs: Logging };
const TITLES = { dashboard: 'Dashboard', recon: 'Recon', enumeration: 'Enumeration', cve: 'CVE & Nuclei', ops: 'Infrastructure', core: 'Core application', creative: 'Creative', chaining: 'Chaining', resources: 'Resources', logs: 'Logs', settings: 'Settings' };

const readSection = () => {
  const s = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return s in TITLES ? s : 'dashboard';
};

export default function App() {
  const [targets, setTargets] = useState([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('bh-target') || '');
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState(readSection);
  const [status, setStatus] = useState(null);
  const [services, setServices] = useState({ server: 'checking', toolkit: 'checking' });
  const [dialog, setDialog] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const switcherRef = useRef(null);

  const refresh = useCallback(async (selectFqdn) => {
    try {
      const { data } = await api.post('/api/fqdn/all', {});
      const list = Array.isArray(data) ? [...data].sort((a, b) => a.fqdn.localeCompare(b.fqdn)) : [];
      setTargets(list);
      setServices((s) => ({ ...s, server: 'online' }));
      if (selectFqdn) {
        const hit = list.find((t) => t.fqdn === selectFqdn);
        if (hit) setActiveId(hit._id);
      }
    } catch (err) {
      setServices((s) => ({ ...s, server: 'offline' }));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Scan status. Poll faster while a scan runs.
  useEffect(() => {
    let alive = true;
    let timer;
    const tick = async () => {
      try {
        const { data } = await toolkit.get('/status', { timeout: 4000 });
        if (!alive) return;
        setStatus((prev) => {
          if (prev?.scan_running && !data.scan_running) refresh();
          return data;
        });
        setServices((s) => ({ ...s, toolkit: 'online' }));
      } catch {
        if (alive) setServices((s) => ({ ...s, toolkit: 'offline' }));
      }
      if (alive) timer = window.setTimeout(tick, status?.scan_running ? 1000 : 4000);
    };
    tick();
    return () => { alive = false; window.clearTimeout(timer); };
  }, [refresh, status?.scan_running]);

  useEffect(() => {
    const onHash = () => setSection(readSection());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => { document.title = `${TITLES[section]} · Bounty Hawk`; }, [section]);

  useEffect(() => {
    if (activeId) localStorage.setItem('bh-target', activeId);
  }, [activeId]);

  useEffect(() => {
    if (!switcher) return undefined;
    const close = (e) => { if (!switcherRef.current?.contains(e.target)) setSwitcher(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [switcher]);

  const active = targets.find((t) => t._id === activeId) || targets[0] || null;
  const running = Boolean(status?.scan_running);
  const progress = running && status.scan_complete ? Math.min(99, Math.round((status.scan_step / status.scan_complete) * 100)) : 0;

  const go = (path) => { window.location.hash = `/${path}`; setNavOpen(false); };

  const stop = async () => {
    if (!window.confirm('Stop the running scan? Its subprocesses will be terminated.')) return;
    try { await toolkit.get('/terminate-subprocesses'); toast.success('Stop signal sent'); }
    catch (err) { toast.error(errorText(err, 'The toolkit did not respond')); }
  };

  const Section = SECTIONS[section];

  let content;
  if (section === 'settings') {
    content = <Settings targets={targets} active={active} setActive={setActiveId} refresh={refresh} openAdd={() => setDialog('add')} services={services} />;
  } else if (!loaded) {
    content = <div className="b-page"><p className="muted">Loading targets…</p></div>;
  } else if (!active) {
    content = (
      <Empty icon={<Globe2 size={22} />} title={services.server === 'offline' ? "Can't reach the Express API" : 'Add your first target'}
        action={services.server !== 'offline' && <Button variant="primary" onClick={() => setDialog('add')}><Plus size={15} /> Add target</Button>}>
        {services.server === 'offline'
          ? <>Start MongoDB and <code>node server/server.js</code>, then reload. Or run <code>npm run dev:mock</code> to try the UI with sample data.</>
          : 'Everything in Bounty Hawk hangs off an in-scope domain. Add one by hand, from a Burp project config, or from an earlier export.'}
      </Empty>
    );
  } else {
    content = <Section key={active._id} thisFqdn={active} navigate={go} />;
  }

  return (
    <div className="b-shell">
      {navOpen && <button className="b-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
      <aside className={`b-sidebar ${navOpen ? 'open' : ''}`}>
        <div className="b-brand">
          <span className="b-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48"><path d="M24 5 35 12l8-2-5 11 3 10-10-3-7 15-7-15-10 3 3-10-5-11 8 2L24 5Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /><circle cx="19.5" cy="21.5" r="2" fill="currentColor" /><circle cx="28.5" cy="21.5" r="2" fill="currentColor" /></svg>
          </span>
          <span className="b-brand-name">Bounty Hawk</span>
          <IconButton label="Close navigation" className="b-nav-close" onClick={() => setNavOpen(false)}><X size={18} /></IconButton>
        </div>

        <div className="b-switcher" ref={switcherRef}>
          <span className="b-switcher-label">Target</span>
          <button type="button" className="b-switcher-btn" onClick={() => setSwitcher((o) => !o)} aria-expanded={switcher}>
            <span className="b-avatar">{active ? active.fqdn[0].toUpperCase() : '?'}</span>
            <span className="b-switcher-copy"><strong>{active?.fqdn || 'No target'}</strong><small>{active ? `${active.recon?.subdomains?.consolidated?.length || 0} subdomains` : 'Add one to begin'}</small></span>
            <ChevronsUpDown size={15} />
          </button>
          {switcher && (
            <div className="b-switcher-menu" role="menu">
              {targets.map((t) => (
                <button key={t._id} type="button" role="menuitem" onClick={() => { setActiveId(t._id); setSwitcher(false); }}>
                  <span className="b-avatar sm">{t.fqdn[0].toUpperCase()}</span><span className="mono">{t.fqdn}</span>{t._id === active?._id && <Check size={14} />}
                </button>
              ))}
              {targets.length > 0 && <hr />}
              <button type="button" role="menuitem" onClick={() => { setSwitcher(false); setDialog('add'); }}><Plus size={15} /><span>Add target</span></button>
            </div>
          )}
        </div>

        <nav className="b-nav">
          {NAV.map((g, i) => (
            <div className="b-nav-group" key={g.label || i}>
              {g.label && <div className="b-nav-label">{g.label}</div>}
              {g.items.map(([id, label, Icon]) => (
                <a key={id} href={`#/${id}`} className={`b-nav-item ${section === id ? 'active' : ''}`} aria-current={section === id ? 'page' : undefined} onClick={() => setNavOpen(false)}>
                  <Icon size={16} strokeWidth={1.9} /><span>{label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="b-sidebar-foot">
          <a href="#/settings" className={`b-nav-item ${section === 'settings' ? 'active' : ''}`} onClick={() => setNavOpen(false)}><SettingsIcon size={16} strokeWidth={1.9} /><span>Settings</span></a>
          <div className="b-services">
            <span className={`b-svc b-svc-${services.server}`}><i />API</span>
            <span className={`b-svc b-svc-${services.toolkit}`}><i />Toolkit</span>
          </div>
        </div>
      </aside>

      <div className="b-main">
        <header className="b-topbar">
          <IconButton label="Open navigation" className="b-menu-btn" onClick={() => setNavOpen(true)}><Menu size={19} /></IconButton>
          <span className="b-topbar-title">{TITLES[section]}</span>
          <div className="b-scan">
            {running ? (
              <>
                <span className="b-live" />
                <span className="b-scan-copy"><strong>{status.core_module} · {status.scan_target}</strong><small>{status.scan_step_name} · {status.scan_step}/{status.scan_complete}</small></span>
                <span className="b-progress"><span style={{ width: `${progress}%` }} /></span>
                <Button size="sm" variant="danger" onClick={stop}><Square size={12} /> Stop</Button>
              </>
            ) : (
              <>
                <span className="b-scan-copy muted"><small>{services.toolkit === 'offline' ? 'Toolkit offline' : 'No scan running'}</small></span>
                <Button size="md" variant="primary" onClick={() => setDialog('wildfire')} disabled={!active || services.toolkit !== 'online'}><Flame size={14} /> <span className="b-btn-label">Run Wildfire</span></Button>
              </>
            )}
          </div>
        </header>

        <main className="b-content">
          {MOCK_MODE && <div className="b-banner b-banner-info"><FlaskConical size={15} /><span><strong>Mock mode.</strong> Sample data, nothing leaves the browser. Run <code>npm start</code> for the real services.</span></div>}
          {!MOCK_MODE && loaded && (services.server === 'offline' || services.toolkit === 'offline') && targets.length > 0 && (
            <div className="b-banner b-banner-warn"><AlertTriangle size={15} /><span>Can't reach the {[services.server === 'offline' && 'Express API', services.toolkit === 'offline' && 'toolkit service'].filter(Boolean).join(' or ')}. Check it's running; see Settings.</span></div>
          )}
          {content}
        </main>
      </div>

      <AddFqdnModal open={dialog === 'add'} onClose={() => setDialog(null)} targets={targets}
        onDone={async (fqdn, message) => { setDialog(null); toast.success(message); await refresh(fqdn); }} />
      <WildfireModal open={dialog === 'wildfire'} onClose={() => setDialog(null)} target={active} targets={targets} onStarted={() => setStatus((s) => ({ ...(s || {}), scan_running: true, scan_step: 1, scan_complete: 1, scan_step_name: 'Starting…', scan_target: active?.fqdn, core_module: 'Wildfire.py' }))} />
      <Toaster position="bottom-right" toastOptions={{ className: 'b-toast', duration: 3500 }} />
    </div>
  );
}
