import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Cloud, ExternalLink, Network, RefreshCw, ShieldAlert } from 'lucide-react';
import { api, errorText } from '../api';
import { VULN_KEYS } from '../mock';
import { Badge, Button, Card, Empty, PageHeader, Segmented, SEVERITIES, Severity, Stat } from './ui';

const arr = (v) => (Array.isArray(v) ? v : []);
const SOURCES = [
  ['Web scraping', [['Amass', 'amass'], ['Sublist3r', 'sublist3r'], ['Assetfinder', 'assetfinder'], ['gau', 'gau'], ['CT logs', 'ctl'], ['Subfinder', 'subfinder'], ['Shosubgo', 'shosubgo'], ['GitHub', 'githubSearch']]],
  ['Brute force', [['ShuffleDNS', 'shuffledns'], ['ShuffleDNS (CeWL)', 'shufflednsCustom']]],
  ['Link & JS discovery', [['GoSpider', 'gospider'], ['Hakrawler', 'hakrawler'], ['SubDomainizer', 'subdomainizer']]],
];
const DNS_TYPES = [['A', 'arecord'], ['AAAA', 'aaaarecord'], ['CNAME', 'cnamerecord'], ['MX', 'mxrecord'], ['NS', 'nsrecord'], ['TXT', 'txtrecord'], ['SPF', 'spfrecord'], ['SOA', 'soarecord'], ['SRV', 'srvrecord'], ['PTR', 'ptrrecord'], ['Node', 'node']];

// Amass graph lines: "<from> (<Type>) --> <relation> --> <to> (<Type>)"
const EDGE = /^(.+?) \(([^)]+)\) --> (\S+) --> (.+?) \(([^)]+)\)\s*$/;
function parseEdge(line) {
  const m = EDGE.exec(String(line));
  return m ? { from: m[1], rel: m[3], to: m[4] } : null;
}
const href = (v) => (/^https?:\/\//.test(v) ? v : `https://${v}`);

function buildInfra(doc) {
  const edges = [...arr(doc.asns), ...arr(doc.subnets), ...arr(doc.isps), ...arr(doc.dns?.arecord), ...arr(doc.dns?.aaaarecord)].map(parseEdge).filter(Boolean);
  const by = (rel) => edges.filter((e) => e.rel === rel);
  const hostsFor = (ip) => [...by('a_record'), ...by('aaaa_record')].filter((e) => e.to === ip).map((e) => e.from);
  return [...new Set(by('announces').map((e) => e.from))].map((asn) => ({
    asn,
    org: by('managed_by').find((e) => e.from === asn)?.to,
    netblocks: by('announces').filter((e) => e.from === asn).map((e) => ({
      cidr: e.to,
      ips: by('contains').filter((c) => c.from === e.to).map((c) => ({ ip: c.to, hosts: hostsFor(c.to) })),
    })),
  }));
}

export default function Dashboard({ thisFqdn, navigate }) {
  const [doc, setDoc] = useState(thisFqdn);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listTab, setListTab] = useState('subdomains');
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.post('/api/fqdn', { _id: thisFqdn._id })
      .then((res) => { if (res.data) setDoc(res.data); setError(''); })
      .catch((err) => setError(errorText(err, 'Could not reload this target')))
      .finally(() => setLoading(false));
  };
  useEffect(load, [thisFqdn._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sd = doc.recon?.subdomains || {};
  const consolidated = arr(sd.consolidated);
  const consolidatedNew = new Set(arr(sd.consolidatedNew));
  const live = arr(sd.httprobe);
  const liveNew = new Set(arr(sd.httprobeAdded));
  const vulns = useMemo(() => VULN_KEYS.filter((k) => k !== 'vulns').flatMap((k) => arr(doc[k])), [doc]);
  const impactful = vulns
    .filter((v) => v?.info?.severity && v.info.severity !== 'info')
    .sort((a, b) => SEVERITIES.indexOf(a.info.severity) - SEVERITIES.indexOf(b.info.severity));
  const infra = useMemo(() => buildInfra(doc), [doc]);
  const aws = doc.aws || {};
  const cloud = [
    ['S3 buckets', arr(aws.s3).map((b) => b.domain + [b.public && 'public', b.downloadExploit && 'download', b.uploadExploit && 'upload', b.subdomainTakeover && 'takeover'].filter(Boolean).map((t) => ` · ${t}`).join(''))],
    ['CloudFront', arr(aws.cloudfront)], ['EC2', arr(aws.ec2)], ['ELB', arr(aws.elb)], ['Elastic Beanstalk', arr(aws.elasticbeanstalk)], ['API Gateway', arr(aws.api_gateway)], ['DocumentDB', arr(aws.documentdb)],
  ];
  const cloudCount = cloud.reduce((n, [, list]) => n + list.length, 0);
  const maxSource = Math.max(1, ...SOURCES.flatMap(([, tools]) => tools.map(([, k]) => arr(sd[k]).length)));

  const listRows = (listTab === 'subdomains' ? consolidated : live)
    .filter((v) => !filter || v.toLowerCase().includes(filter.toLowerCase()))
    .sort();
  const isNew = (v) => (listTab === 'subdomains' ? consolidatedNew.has(v) : liveNew.has(v));

  return (
    <div className="b-page">
      <PageHeader
        title={doc.fqdn}
        description={<>
          {doc.targetUrls?.length ? <>Target URL <a href={doc.targetUrls[0]} target="_blank" rel="noreferrer" className="mono">{doc.targetUrls[0]}</a> · </> : 'No target URL yet · '}
          Updated {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}
        </>}
        actions={<Button onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Reload</Button>}
      />
      {error && <div className="b-banner b-banner-warn">{error}</div>}

      <div className="b-stats">
        <Stat label="Subdomains" value={consolidated.length} hint={`${consolidatedNew.size} new`} onClick={() => navigate('recon/build-unique-subdomain-list')} />
        <Stat label="Live URLs" value={live.length} hint={`${liveNew.size} new`} onClick={() => navigate('recon/check-status-with-httprobe')} />
        <Stat label="Impactful Nuclei findings" value={impactful.length} hint={`of ${vulns.length} total`} onClick={() => navigate('cve')} />
        <Stat label="Cloud assets" value={cloudCount} hint={`${arr(doc.ips).length} IPs · ${infra.length} ASNs`} onClick={() => navigate('ops')} />
      </div>

      <div className="b-grid b-grid-2-1">
        <Card title="Impactful findings" subtitle="Non-info Nuclei results. Verify each one by hand." flush action={<Button size="sm" variant="ghost" onClick={() => navigate('cve')}>Open CVE & Nuclei <ArrowRight size={14} /></Button>}>
          {impactful.length ? (
            <ul className="b-list">
              {impactful.slice(0, 12).map((v, i) => (
                <li key={v._id || i}>
                  <Severity value={v.info.severity} />
                  <span className="b-list-main"><strong>{v.info.name}</strong><a className="mono" href={href(v['matched-at'] || v.host)} target="_blank" rel="noreferrer">{v['matched-at'] || v.host}</a></span>
                  <span className="b-list-meta mono">{v['template-id']}</span>
                </li>
              ))}
            </ul>
          ) : <Empty icon={<ShieldAlert size={20} />} title="No impactful findings">Run Fire-Scanner, or import Nuclei results in CVE & Nuclei.</Empty>}
        </Card>

        <Card title="Subdomain sources" subtitle="Results per recon tool">
          {SOURCES.map(([groupName, tools]) => (
            <div className="b-sources" key={groupName}>
              <div className="b-sources-label">{groupName}</div>
              {tools.map(([name, key]) => {
                const n = arr(sd[key]).length;
                return (
                  <div className="b-bar-row" key={key}>
                    <span>{name}</span>
                    <span className="b-bar"><span style={{ width: `${(n / maxSource) * 100}%` }} /></span>
                    <strong className={n ? '' : 'muted'}>{n}</strong>
                  </div>
                );
              })}
            </div>
          ))}
        </Card>
      </div>

      <Card flush>
        <div className="b-toolbar">
          <Segmented value={listTab} onChange={setListTab} options={[{ value: 'subdomains', label: 'Subdomains', count: consolidated.length }, { value: 'live', label: 'Live URLs', count: live.length }]} />
          <input className="b-input b-input-sm" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" aria-label="Filter list" />
        </div>
        {listRows.length ? (
          <ul className="b-hostlist">
            {listRows.map((v) => (
              <li key={v}>
                <a className="mono" href={href(v)} target="_blank" rel="noreferrer">{v}</a>
                {isNew(v) && <Badge tone="blue">new</Badge>}
              </li>
            ))}
          </ul>
        ) : <div className="b-card-empty">{consolidated.length || live.length ? 'Nothing matches.' : 'No results yet. Work through Recon or run Fire-Starter.'}</div>}
      </Card>

      <div className="b-grid b-grid-2">
        <Card title="Infrastructure map" subtitle="ASN → netblock → IP → hostnames, from Amass">
          {infra.length ? (
            <div className="b-tree">
              {infra.map((a) => (
                <div key={a.asn} className="b-tree-asn">
                  <div className="b-tree-node"><Network size={14} /><strong>AS{a.asn}</strong>{a.org && <span className="muted">{a.org}</span>}</div>
                  {a.netblocks.map((nb) => (
                    <div key={nb.cidr} className="b-tree-child">
                      <div className="b-tree-node mono">{nb.cidr}</div>
                      {nb.ips.map((ip) => (
                        <div key={ip.ip} className="b-tree-child">
                          <div className="b-tree-node"><span className="mono">{ip.ip}</span>{ip.hosts.map((h) => <a key={h} className="mono b-chip" href={href(h)} target="_blank" rel="noreferrer">{h}</a>)}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : <p className="muted">No ASN data yet. Amass collects it during Fire-Starter.</p>}
        </Card>

        <Card title="Cloud services">
          {cloudCount ? (
            <dl className="b-kv">
              {cloud.filter(([, list]) => list.length).map(([label, list]) => (
                <div key={label}><dt>{label}</dt><dd>{list.map((v) => <span key={v} className="mono">{v}</span>)}</dd></div>
              ))}
            </dl>
          ) : <Empty icon={<Cloud size={20} />} title="No cloud assets">Fire-Cloud checks AWS, Azure and GCP.</Empty>}
        </Card>
      </div>

      <div className="b-grid b-grid-2">
        <Card title="DNS records">
          {DNS_TYPES.some(([, k]) => arr(doc.dns?.[k]).length) ? (
            <div className="b-dns">
              {DNS_TYPES.filter(([, k]) => arr(doc.dns?.[k]).length).map(([type, k]) => (
                <div key={k} className="b-dns-group">
                  <span className="b-dns-type">{type}</span>
                  <ul>{arr(doc.dns[k]).sort().map((r) => { const e = parseEdge(r); return <li key={r} className="mono">{e ? <>{e.from} <span className="muted">→</span> {e.to}</> : r}</li>; })}</ul>
                </div>
              ))}
            </div>
          ) : <p className="muted">No DNS records yet.</p>}
        </Card>
        <Card title="IPs & open ports">
          {arr(doc.ips).length ? (
            <ul className="b-hostlist b-hostlist-tight">
              {arr(doc.ips).map((ip) => (
                <li key={ip.ip}><span className="mono">{ip.ip}</span>{arr(ip.ports).map((p) => <span className="b-chip mono" key={p}>{p}</span>)}{ip.ports?.length ? null : <span className="muted">no ports scanned</span>}<a className="b-ext" href={`http://${ip.ip}`} target="_blank" rel="noreferrer" aria-label={`Open ${ip.ip}`}><ExternalLink size={13} /></a></li>
              ))}
            </ul>
          ) : <p className="muted">No IPs yet.</p>}
        </Card>
      </div>
    </div>
  );
}
