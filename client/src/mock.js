// In-browser stand-in for the Express API and toolkit service (VITE_MOCK=1 only).
// Shapes follow server/models/*.model.js. Nothing here touches the network.

const SUBDOMAIN_KEYS = ['gospider', 'hakrawler', 'subdomainizer', 'sublist3r', 'amass', 'assetfinder', 'gau', 'ctl', 'shosubgo', 'subfinder', 'githubSearch', 'shuffledns', 'shufflednsCustom', 'cloudRanges', 'consolidated', 'consolidatedNew', 'httprobe', 'httprobeAdded', 'httprobeRemoved', 'masscan', 'masscanAdded', 'masscanRemoved', 'masscanLive']
export const VULN_KEYS = ['vulns', 'vulnsSSL', 'vulnsFile', 'vulnsDNS', 'vulnsVulns', 'vulnsTech', 'vulnsMisconfig', 'vulnsCVEs', 'vulnsCNVD', 'vulnsExposed', 'vulnsExposure', 'vulnsMisc', 'vulnsNetwork', 'vulnsRs0n', 'vulnsHeadless']
const DNS_KEYS = ['arecord', 'aaaarecord', 'cnamerecord', 'mxrecord', 'txtrecord', 'node', 'nsrecord', 'srvrecord', 'ptrrecord', 'spfrecord', 'soarecord']

let seq = 1
const oid = () => `665${String(seq++).padStart(21, '0')}`
const now = () => new Date().toISOString()
const ago = (m) => new Date(Date.now() - m * 60000).toISOString()

/** A target document with every array the schema defines, so no component meets `undefined`. */
export function emptyFqdn(fqdn) {
  return {
    _id: oid(),
    fqdn,
    dns: Object.fromEntries(DNS_KEYS.map((k) => [k, []])),
    aws: { s3: [], ec2: [], cloudfront: [], elb: [], documentdb: [], api_gateway: [], elasticbeanstalk: [] },
    azure: {},
    gcp: {},
    ips: [],
    subnets: [],
    asns: [],
    isps: [],
    recon: {
      subdomains: Object.fromEntries(SUBDOMAIN_KEYS.map((k) => [k, []])),
      osint: { notableRepos: [], GithubSearch: [], GithubUsers: [], Google: [], Shodan: [], Censys: [] },
    },
    ...Object.fromEntries(VULN_KEYS.map((k) => [k, []])),
    targetUrls: [],
    createdAt: now(),
    updatedAt: now(),
  }
}

const vuln = (template, name, severity, host, extra = {}) => ({
  _id: oid(),
  impactful: severity !== 'info',
  host,
  'template-id': template,
  info: { author: ['pdteam'], name, severity, description: extra.description || `${name} detected on ${host}.`, reference: extra.reference || [], tags: extra.tags || [] },
  'extracted-results': extra.extracted || [],
  ip: '93.184.215.14',
  'matched-at': extra.matched || `https://${host}`,
  'matcher-name': extra.matcher || '',
  timestamp: ago(Math.round(Math.random() * 900)),
  type: 'http',
  'curl-command': `curl -X 'GET' -H 'User-Agent: Mozilla/5.0' 'https://${host}'`,
})

function seed() {
  const a = emptyFqdn('example.com')
  const sd = a.recon.subdomains
  sd.amass = ['example.com', 'www.example.com', 'api.example.com', 'docs.example.com', 'status.example.com']
  sd.subfinder = ['www.example.com', 'api.example.com', 'cdn.example.com', 'staging.example.com']
  sd.sublist3r = ['www.example.com', 'mail.example.com']
  sd.assetfinder = ['www.example.com', 'api.example.com', 'dev.example.com']
  sd.ctl = ['*.example.com', 'example.com', 'auth.example.com']
  sd.gospider = ['https://www.example.com/static/app.js', 'https://api.example.com/v1']
  sd.shuffledns = ['vpn.example.com']
  sd.consolidated = ['example.com', 'www.example.com', 'api.example.com', 'docs.example.com', 'status.example.com', 'cdn.example.com', 'staging.example.com', 'mail.example.com', 'dev.example.com', 'auth.example.com', 'vpn.example.com']
  sd.consolidatedNew = ['auth.example.com', 'vpn.example.com']
  sd.httprobe = ['https://www.example.com', 'https://api.example.com', 'https://docs.example.com', 'https://status.example.com', 'https://staging.example.com', 'http://dev.example.com']
  sd.httprobeAdded = ['https://staging.example.com']
  // Amass graph-line format, as written by toolkit/fire-starter.py.
  const A = (host, ip) => `${host} (FQDN) --> a_record --> ${ip} (IPAddress)`
  a.dns.arecord = [A('example.com', '93.184.215.14'), A('www.example.com', '93.184.215.14'), A('api.example.com', '93.184.215.20'), A('staging.example.com', '198.51.100.7')]
  a.dns.aaaarecord = ['example.com (FQDN) --> aaaa_record --> 2606:2800:21f:cb07:6820:80da:af6b:8b2c (IPAddress)']
  a.dns.cnamerecord = ['docs.example.com (FQDN) --> cname_record --> example.gitbook.io (FQDN)', 'cdn.example.com (FQDN) --> cname_record --> d111111abcdef8.cloudfront.net (FQDN)', 'status.example.com (FQDN) --> cname_record --> statuspage.example.net (FQDN)']
  a.dns.mxrecord = ['example.com (FQDN) --> mx_record --> mail.example.com (FQDN)']
  a.dns.nsrecord = ['example.com (FQDN) --> ns_record --> a.iana-servers.net (FQDN)', 'example.com (FQDN) --> ns_record --> b.iana-servers.net (FQDN)']
  a.dns.txtrecord = ['example.com (FQDN) --> txt_record --> "v=spf1 -all" (TXT)']
  a.aws.cloudfront = ['cdn.example.com -> d111111abcdef8.cloudfront.net']
  a.aws.s3 = [{ domain: 'example-assets.s3.amazonaws.com', public: true, downloadExploit: true, uploadExploit: false, authenticated: false, subdomainTakeover: false, files: ['logo.png', 'backup-2024.zip'] }]
  a.ips = [{ ip: '93.184.215.14', ports: ['80', '443'] }, { ip: '93.184.215.20', ports: ['443'] }, { ip: '198.51.100.7', ports: ['22', '443', '8080'] }]
  a.asns = ['15133 (ASN) --> announces --> 93.184.215.0/24 (Netblock)', '64500 (ASN) --> announces --> 198.51.100.0/24 (Netblock)']
  a.subnets = ['93.184.215.0/24 (Netblock) --> contains --> 93.184.215.14 (IPAddress)', '93.184.215.0/24 (Netblock) --> contains --> 93.184.215.20 (IPAddress)', '198.51.100.0/24 (Netblock) --> contains --> 198.51.100.7 (IPAddress)']
  a.isps = ['15133 (ASN) --> managed_by --> EDGECAST (RIROrganization)', '64500 (ASN) --> managed_by --> EXAMPLE-HOSTING (RIROrganization)']
  a.targetUrls = ['https://www.example.com', 'https://api.example.com']
  a.vulnsCVEs = [
    vuln('CVE-2023-44487', 'HTTP/2 Rapid Reset', 'high', 'cdn.example.com', { reference: ['https://nvd.nist.gov/vuln/detail/CVE-2023-44487'], tags: ['cve', 'dos'] }),
    vuln('CVE-2024-mock', 'Outdated Swagger UI with DOM XSS', 'critical', 'docs.example.com', { matched: 'https://docs.example.com/?configUrl=', tags: ['cve', 'xss', 'swagger'] }),
  ]
  a.vulnsMisconfig = [
    vuln('cors-misconfig', 'CORS allows arbitrary origin with credentials', 'high', 'api.example.com', { matched: 'https://api.example.com/v1/me', tags: ['cors'] }),
    vuln('http-missing-security-headers', 'Missing Content-Security-Policy', 'info', 'www.example.com', { tags: ['headers'] }),
  ]
  a.vulnsExposure = [vuln('git-config', 'Exposed .git/config', 'medium', 'staging.example.com', { matched: 'https://staging.example.com/.git/config', tags: ['exposure', 'git'] })]
  a.vulnsTech = [
    vuln('tech-detect', 'nginx', 'info', 'www.example.com', { extracted: ['nginx/1.25.3'], tags: ['tech'] }),
    vuln('tech-detect', 'React', 'info', 'www.example.com', { tags: ['tech'] }),
    vuln('tech-detect', 'Swagger UI', 'info', 'docs.example.com', { extracted: ['4.15.5'], tags: ['tech'] }),
  ]
  a.vulnsSSL = [vuln('weak-cipher-suites', 'Weak TLS cipher suites', 'low', 'status.example.com', { tags: ['ssl'] })]
  a.vulns = [...a.vulnsCVEs, ...a.vulnsMisconfig]
  a.updatedAt = ago(22)

  const b = emptyFqdn('example.org')
  b.recon.subdomains.amass = ['www.example.org']
  b.recon.subdomains.consolidated = ['example.org', 'www.example.org']
  b.createdAt = b.updatedAt = ago(60 * 30)
  return [a, b]
}

const db = {
  fqdns: seed(),
  urls: [{ _id: oid(), url: 'https://www.example.com', fqdn: 'example.com', endpoints: [{ endpoint: '/login', httpVerb: 'GET', statusCode: 200, responseLength: 4210 }], createdAt: ago(600), updatedAt: ago(30) }],
  logs: [
    { _id: oid(), scan: 'Wildfire · Fire Starter · example.com', logFile: ['[+] Running Amass', '[+] 5 subdomains', '[+] Running Subfinder', '[+] 4 subdomains', '[+] httprobe: 6 live'], createdAt: ago(1440), updatedAt: ago(1440) },
    { _id: oid(), scan: 'Wildfire · Fire Scanner · example.com', logFile: ['[+] nuclei -t cves/', '[!] CVE-2024-mock on docs.example.com', '[+] nuclei -t misconfiguration/', '[!] cors-misconfig on api.example.com', '[+] Done'], createdAt: ago(120), updatedAt: ago(110) },
  ],
  cves: [],
}

const IDLE = { scan_running: false, scan_step: 0, scan_complete: 0, scan_step_name: 'Not Running', scan_target: 'N/a' }
let status = { ...IDLE }
let timer

const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)))
const parse = (data) => { try { return typeof data === 'string' ? JSON.parse(data) : data || {} } catch { return {} } }

function server(path, body) {
  const f = db.fqdns
  switch (path) {
    case '/api/ping': return { message: 'pong' }
    case '/api/fqdn/all': return f
    case '/api/fqdn': return f.find((x) => x._id === body._id) || null
    case '/api/auto': return f.find((x) => x.fqdn === body.fqdn) || null
    case '/api/fqdn/new': { const doc = { ...emptyFqdn(body.fqdn), ...body, _id: oid() }; f.push(doc); return doc }
    case '/api/fqdn/update':
    case '/api/auto/update': {
      const doc = f.find((x) => (path === '/api/auto/update' ? x.fqdn === body.fqdn : x._id === body._id))
      if (doc) Object.assign(doc, clone(body), { updatedAt: now() })
      return doc || null
    }
    case '/api/fqdn/delete': db.fqdns = f.filter((x) => x._id !== body._id); return { success: true }
    case '/api/url/all': return db.urls
    case '/api/url': return db.urls.find((u) => u._id === body._id) || null
    case '/api/url/auto': return db.urls.find((u) => u.url === body.url) || null
    case '/api/url/new': { const doc = { _id: oid(), endpoints: [], ...body, createdAt: now(), updatedAt: now() }; db.urls.push(doc); return doc }
    case '/api/url/update':
    case '/api/url/auto/update': {
      const doc = db.urls.find((u) => (path === '/api/url/update' ? u._id === body._id : u.url === body.url))
      if (doc) Object.assign(doc, clone(body), { updatedAt: now() })
      return doc || null
    }
    case '/api/url/delete': db.urls = db.urls.filter((u) => u._id !== body._id); return { success: true }
    case '/api/url/auto/delete': db.urls = db.urls.filter((u) => u.url !== body.url); return { success: true }
    case '/api/cve/all': return db.cves
    case '/api/cve/new': { const doc = { _id: oid(), ...body }; db.cves.push(doc); return doc }
    case '/api/cve/delete': db.cves = db.cves.filter((c) => c.cve !== body.cve); return { success: true }
    case '/api/log/all': return db.logs
    case '/api/log/new': { const doc = { _id: oid(), ...body, createdAt: now(), updatedAt: now() }; db.logs.push(doc); return doc }
    case '/api/log/delete': db.logs = []; return { acknowledged: true }
    case '/api/populate-burp':
    case '/api/scan/default':
    case '/api/scan/deep':
      return new Promise(() => {}) // the real controllers never respond either
    default: {
      const error = new Error(`Mock server has no route ${path}`)
      error.status = 404
      throw error
    }
  }
}

const STEPS = ['Amass', 'Subfinder', 'Sublist3r', 'Assetfinder', 'CTL', 'ShuffleDNS', 'Consolidate', 'httprobe', 'DNS records', 'Cloud ranges', 'Nuclei: tech', 'Nuclei: CVEs', 'Nuclei: misconfig', 'Writing results']

function toolkitRoute(path, body) {
  switch (path) {
    case '/ping': return { message: 'pong!' }
    case '/status': return status
    case '/terminate-subprocesses':
      window.clearInterval(timer)
      status = { ...IDLE }
      return { message: 'Subprocesses terminated successfully' }
    case '/collect_sceenshots': return 'Done!'
    case '/wildfire': {
      if (status.scan_running) return { message: 'ERROR: Scan Running...' }
      const total = ((body.fireStarter ? 14 : 0) + (body.fireCloud ? 8 : 0) + (body.fireScanner ? 12 : 0)) * (body.domainCount || 1)
      status = { scan_running: true, scan_step: 1, scan_complete: total, scan_step_name: 'Starting...', scan_target: body.fqdn, core_module: 'Wildfire.py' }
      return new Promise((resolve) => {
        timer = window.setInterval(() => {
          status = { ...status, scan_step: status.scan_step + 1, scan_step_name: STEPS[status.scan_step % STEPS.length] }
          if (status.scan_step >= status.scan_complete) {
            window.clearInterval(timer)
            db.logs.push({ _id: oid(), scan: `Wildfire · ${status.scan_target}`, logFile: STEPS.map((s) => `[+] ${s}`), createdAt: now(), updatedAt: now() })
            status = { ...IDLE }
            resolve({ message: 'Done!' })
          }
        }, 700)
      })
    }
    default: {
      const error = new Error(`Mock toolkit has no route ${path}`)
      error.status = 404
      throw error
    }
  }
}

export function mockAdapter(kind) {
  return async (config) => {
    await new Promise((r) => setTimeout(r, 90))
    const path = (config.url || '').replace(/^https?:\/\/[^/]+/, '')
    const body = parse(config.data)
    const run = async () => (kind === 'server' ? server(path, body) : toolkitRoute(path, body))
    const timeout = config.timeout
      ? new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ECONNABORTED', config })), config.timeout))
      : null
    try {
      const data = await (timeout ? Promise.race([run(), timeout]) : run())
      return { data: clone(data), status: 200, statusText: 'OK', headers: {}, config }
    } catch (error) {
      if (error.code === 'ECONNABORTED') throw error
      const response = { data: { error: error.message }, status: error.status || 500, statusText: 'Error', headers: {}, config }
      throw Object.assign(new Error(error.message), { response, config })
    }
  }
}
