import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Crosshair, ExternalLink, ImageOff, Send } from 'lucide-react';
import { errorText, handOff } from '../api';
import { Badge, Button, Empty } from './ui';

const arr = (v) => (Array.isArray(v) ? v : []);
const hostOf = (url) => String(url).replace(/^[a-z]+:\/\//, '').split(/[/:]/)[0];
// toolkit/wildfire.py --screenshots saves to client/public/screenshots/<url with // -> __>.png
const shotFor = (url) => `/screenshots/${String(url).replace('//', '__')}.png`;

function Shot({ url, className }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`${className} b-shot-missing`}><ImageOff size={16} /><span>No screenshot</span></div>;
  return <img className={className} src={shotFor(url)} alt={`Screenshot of ${url}`} loading="lazy" onError={() => setFailed(true)} />;
}

export default function Enumeration({ thisFqdn }) {
  const urls = arr(thisFqdn.recon?.subdomains?.httprobe);
  const fallback = `https://${thisFqdn.fqdn}`;
  const [selected, setSelected] = useState(urls[0] || fallback);
  const [target, setTarget] = useState(urls[0] || fallback);
  const [busy, setBusy] = useState('');
  const host = hostOf(selected);
  const records = ['arecord', 'cnamerecord', 'node'].flatMap((k) => arr(thisFqdn.dns?.[k])).filter((r) => r.split(' ')[0] === host).sort();

  const send = async (label, path, body) => {
    if (!window.confirm(`${label}? This asks Burp Suite (REST API on 127.0.0.1:1337) to start scanning.`)) return;
    setBusy(label);
    try {
      await handOff(path, body);
      toast.success(`${label}: sent to Burp. Watch progress in Burp's dashboard.`);
    } catch (err) {
      toast.error(errorText(err, `${label} failed`));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="b-page b-page-wide">
      <div className="b-page-head">
        <div>
          <h1>Enumeration</h1>
          <p>Pick a live URL, look at what it is, then hand it to Burp.</p>
        </div>
        <div className="b-page-actions">
          <Button onClick={() => send('Populate Burp', '/api/populate-burp', urls)} disabled={!urls.length || Boolean(busy)}><Send size={14} /> Populate Burp ({urls.length})</Button>
        </div>
      </div>

      <div className="b-target-bar">
        <span className="muted">Target URL</span>
        <a className="mono strong" href={target} target="_blank" rel="noreferrer">{target}</a>
        <span className="b-spacer" />
        <Button size="sm" onClick={() => send('Default scan', '/api/scan/default', { targetUrl: target })} disabled={Boolean(busy)}>Default scan</Button>
        <Button size="sm" onClick={() => send('Deep scan', '/api/scan/deep', { targetUrl: target })} disabled={Boolean(busy)}>Deep scan</Button>
      </div>

      {urls.length ? (
        <div className="b-enum">
          <ul className="b-enum-list">
            {urls.map((url) => (
              <li key={url}>
                <button type="button" className={url === selected ? 'active' : ''} onClick={() => setSelected(url)}>
                  <Shot url={url} className="b-thumb" />
                  <span className="mono">{url}</span>
                  {url === target && <Badge tone="blue">target</Badge>}
                </button>
              </li>
            ))}
          </ul>
          <section className="b-enum-detail">
            <div className="row-between">
              <h2 className="mono"><a href={selected} target="_blank" rel="noreferrer">{selected} <ExternalLink size={14} /></a></h2>
              <Button size="sm" variant="primary" onClick={() => setTarget(selected)} disabled={selected === target}><Crosshair size={14} /> Set as target URL</Button>
            </div>
            <h3 className="b-section-title">DNS for {host}</h3>
            {records.length ? <ul className="b-records">{records.map((r) => <li key={r} className="mono">{r}</li>)}</ul> : <p className="muted">No A, CNAME or node records for this host.</p>}
            <h3 className="b-section-title">Screenshot</h3>
            <Shot url={selected} className="b-shot" />
          </section>
        </div>
      ) : (
        <Empty title="No live URLs yet">Run httprobe in Recon (Final analysis → Check status with httprobe) to list live hosts here.</Empty>
      )}
    </div>
  );
}
