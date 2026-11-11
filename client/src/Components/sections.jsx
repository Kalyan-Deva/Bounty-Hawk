// The methodology, as data. Each step either has a tool guide (`component`)
// or is shown as "planned". Labels and tool order follow the original tabs.

import React from 'react';
import Methodology from './Methodology';

import Sublist3r from './SubComponents/Sublist3r';
import Amass from './SubComponents/Amass';
import Assetfinder from './SubComponents/Assetfinder';
import Gau from './SubComponents/Gau';
import Ctl from './SubComponents/Ctl';
import Shosubgo from './SubComponents/Shosubgo';
import Subfinder from './SubComponents/Subfinder';
import GithubSubdomains from './SubComponents/GithubSubdomains';
import GoSpider from './SubComponents/GoSpider';
import Hakrawler from './SubComponents/Hakrawler';
import SubDomainizer from './SubComponents/SubDomainizer';
import ShuffleDnsMassive from './SubComponents/ShuffleDnsMassive';
import CustomWordlist from './SubComponents/CustomWordlist';
import ShuffleDnsCustom from './SubComponents/ShuffleDnsCustom';
import CloudRanges from './SubComponents/CloudRanges';
import Dnmasscan from './SubComponents/Dnmasscan';
import FindWebServer from './SubComponents/FindWebServer';
import Consolidator from './SubComponents/Consolidator';
import Httprobe from './SubComponents/Httprobe';
import EyeWitness from './SubComponents/EyeWitness';
import AddTargetUrl from './SubComponents/AddTargetUrl';
import GithubBruteDork from './SubComponents/GithubBruteDork';

import NucleiScansFull from './SubComponents/NucleiScansFull';
import NucleiScansSSL from './SubComponents/NucleiScansSSL';
import NucleiScansFile from './SubComponents/NucleiScansFile';
import NucleiScansDNS from './SubComponents/NucleiScansDNS';
import NucleiScansVulns from './SubComponents/NucleiScansVulns';
import NucleiScansTech from './SubComponents/NucleiScansTech';
import NucleiScansMisconfigs from './SubComponents/NucleiScansMisconfigs';
import NucleiScansCVEs from './SubComponents/NucleiScansCVEs';
import NucleiScansCNVD from './SubComponents/NucleiScansCNVD';
import NucleiScansExposed from './SubComponents/NucleiScansExposed';
import NucleiScansExposure from './SubComponents/NucleiScansExposure';
import NucleiScansMisc from './SubComponents/NucleiScansMisc';
import NucleiScansNetwork from './SubComponents/NucleiScansNetwork';
import NucleiScansRs0n from './SubComponents/NucleiScansRs0n';
import NucleiScansHeadless from './SubComponents/NucleiScansHeadless';

import HopHeaders from './SubComponents/HopHeaders';
import CachePoisoning from './SubComponents/CachePoisoning';
import CacheDeception from './SubComponents/CacheDeception';
import HttpRequestSmuggling from './SubComponents/HttpRequestSmuggling';
import H2cSmuggling from './SubComponents/H2cSmuggling';
import XsltInjection from './SubComponents/XsltInjection';
import EsiInjection from './SubComponents/EsiInjection';
import HostHeader from './SubComponents/HostHeader';
import IpSpoofing from './SubComponents/IpSpoofing';
import AwsS3 from './SubComponents/AwsS3';
import AwsCloudfront from './SubComponents/AwsCloudfront';
import AwsIamSts from './SubComponents/AwsIamSts';
import AwsElasticBean from './SubComponents/AwsElasticBean';
import AwsApiGateway from './SubComponents/AwsApiGateway';
import AwsCognito from './SubComponents/AwsCognito';
import AwsExposedDocDb from './SubComponents/AwsExposedDocDb';
import AwsEc2 from './SubComponents/AwsEc2';
import AwsSns from './SubComponents/AwsSns';
import AwsRds from './SubComponents/AwsRds';

import CspBypass from './SubComponents/CspBypass';
import Cors from './SubComponents/Cors';
import Portswigger from './SubComponents/Portswigger';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const step = (label, component, extra = {}) => ({ id: slug(label), label, component, ...extra });
const group = (label, steps) => ({ label, steps });

export function Recon({ thisFqdn }) {
  return (
    <Methodology section="recon" title="Recon" description="Find every subdomain, live host and server for the target." thisFqdn={thisFqdn} groups={[
      group('Subdomain scraping', [
        step('Sublist3r', Sublist3r), step('Amass', Amass), step('Assetfinder', Assetfinder), step('GetAllUrls (gau)', Gau),
        step('Certificate transparency logs', Ctl), step('Shosubgo', Shosubgo), step('Subfinder', Subfinder), step('GitHub subdomains', GithubSubdomains),
      ]),
      group('Link & JS discovery', [step('GoSpider', GoSpider), step('Hakrawler', Hakrawler), step('SubDomainizer', SubDomainizer)]),
      group('Subdomain brute-forcing', [step('ShuffleDNS: massive wordlist', ShuffleDnsMassive), step('Build custom wordlist', CustomWordlist), step('ShuffleDNS: custom wordlist', ShuffleDnsCustom)]),
      group('Server & port enumeration', [step('Cloud ranges', CloudRanges), step('Dnmasscan', Dnmasscan), step('Identify web servers', FindWebServer)]),
      group('Final analysis', [step('Build unique subdomain list', Consolidator), step('Check status with httprobe', Httprobe), step('Screenshots with EyeWitness', EyeWitness)]),
      group('Next steps', [step('Add target URL', AddTargetUrl), step('GitHub brute dork', GithubBruteDork)]),
    ]} />
  );
}

const NUCLEI = [
  ['Full', 'vulns', NucleiScansFull], ['SSL', 'vulnsSSL', NucleiScansSSL], ['File', 'vulnsFile', NucleiScansFile], ['DNS', 'vulnsDNS', NucleiScansDNS],
  ['Vulns', 'vulnsVulns', NucleiScansVulns], ['Tech', 'vulnsTech', NucleiScansTech], ['Misconfigs', 'vulnsMisconfig', NucleiScansMisconfigs],
  ['CVEs', 'vulnsCVEs', NucleiScansCVEs], ['CNVD', 'vulnsCNVD', NucleiScansCNVD], ['Exposed', 'vulnsExposed', NucleiScansExposed],
  ['Exposure', 'vulnsExposure', NucleiScansExposure], ['Misc', 'vulnsMisc', NucleiScansMisc], ['Network', 'vulnsNetwork', NucleiScansNetwork],
  ['Rs0n', 'vulnsRs0n', NucleiScansRs0n], ['Headless', 'vulnsHeadless', NucleiScansHeadless],
];

export function CveTesting({ thisFqdn }) {
  const nuclei = NUCLEI.map(([name, key, component]) => {
    const list = Array.isArray(thisFqdn?.[key]) ? thisFqdn[key] : [];
    return step(`Nuclei: ${name}`, component, { count: list.length, hot: list.some((v) => v?.info?.severity && v.info.severity !== 'info') });
  });
  return (
    <Methodology section="cve" title="CVE & Nuclei" description="Review Nuclei results by template group. Red counts contain non-info findings." thisFqdn={thisFqdn} groups={[
      group('Third-party scanning', nuclei),
      group('Custom CVE scanning', [step('Add CVE'), step('CVE scan results')]),
    ]} />
  );
}

export function Ops({ thisFqdn }) {
  return (
    <Methodology section="ops" title="Infrastructure & DevOps" description="Proxies, caches, cloud services, web servers and DNS." thisFqdn={thisFqdn} groups={[
      group('Reverse proxy', [
        step('Abusing hop-by-hop headers', HopHeaders), step('Web cache poisoning', CachePoisoning), step('Web cache deception', CacheDeception),
        step('HTTP request smuggling', HttpRequestSmuggling), step('H2C smuggling', H2cSmuggling), step('XSLT server-side injection', XsltInjection),
        step('Edge Side Inclusion (ESI) injection', EsiInjection), step('Host header poisoning', HostHeader), step('IP address spoofing', IpSpoofing),
      ]),
      group('Cloud', [
        step('AWS S3 bucket misconfiguration', AwsS3), step('AWS CloudFront misconfiguration', AwsCloudfront), step('AWS IAM/STS misconfiguration', AwsIamSts),
        step('AWS Elastic Beanstalk misconfiguration', AwsElasticBean), step('AWS API Gateway misconfiguration', AwsApiGateway), step('AWS Cognito misconfiguration', AwsCognito),
        step('AWS exposed DocumentDB', AwsExposedDocDb), step('AWS EC2 misconfiguration', AwsEc2), step('AWS SNS misconfiguration', AwsSns), step('AWS RDS misconfiguration', AwsRds),
        step('Azure tenant enumeration'), step('Azure user enumeration'), step('Azure open storage'), step('Azure credential brute-force'),
        step('Azure ACR misconfiguration'), step('Azure App Service misconfiguration'), step('GCP public bucket'), step('GCP GitHub Actions'),
      ]),
      group('Web server', [step("Known CVEs"), step('Exposed configuration files'), step('Server Side Includes (SSI) injection'), step('Information disclosure (server)')]),
      group('DNS', [step('DNS rebinding'), step('Subdomain takeover')]),
    ]} />
  );
}

export function Core({ thisFqdn }) {
  return (
    <Methodology section="core" title="Core application" description="Config, client-side, server-side and database testing." thisFqdn={thisFqdn} groups={[
      group('Global application config', [
        step('Content Security Policy (CSP)', CspBypass), step('Cross-Origin Resource Sharing (CORS)', Cors), step('Dependency confusion'),
        step('JWT misconfiguration'), step('File inclusion / path traversal (config)'),
      ]),
      group('Client-side code', [
        step('Reflected XSS'), step('DOM-based XSS'), step('Client-side prototype pollution'), step('Client-side template injection'),
        step('postMessage vulnerabilities'), step('Dangling markup'), step('Denial of service (client)'), step('Information disclosure (client)'),
        step('Privileged credentials exposed'), step('DOM-based open redirect'), step('Content injection'), step('Insecure data storage'),
      ]),
      group('Server-side code', [
        step('Command injection'), step('Stored XSS'), step('Blind XSS'), step('Code injection'), step('Server-side prototype pollution'),
        step('Insecure deserialization'), step('LDAP injection'), step('Server-side request forgery (SSRF)'), step('File inclusion / path traversal (server)'),
        step('XPath injection'), step('Cross-site request forgery (CSRF)'), step('Unrestricted file upload'), step('Web shell via file upload'),
        step('Server-side template injection'), step('XML external entity (XXE)'), step('WebSocket injection'),
      ]),
      group('Database operations', [step('SQL injection'), step('NoSQL injection'), step('GraphQL injection'), step('Denial of service (database)'), step('Information disclosure (database)')]),
    ]} />
  );
}

export function Creative({ thisFqdn }) {
  return (
    <Methodology section="creative" title="Creative testing" description="Identity providers, business logic and OSINT." thisFqdn={thisFqdn} groups={[
      group('External IAM', [step('OAuth misconfiguration'), step('SAML misconfiguration'), step('Firebase IAM misconfiguration'), step('Keycloak IAM misconfiguration')]),
      group('Application logic', [
        step('IDOR: read/write'), step('IDOR: read only'), step('Insufficient access controls: read/write'), step('Insufficient access controls: read only'),
        step('Bypass access controls: read/write'), step('Bypass access controls: read only'), step('2FA/MFA bypass'), step('CAPTCHA bypass'),
        step('Rate limiting / brute-force bypass'), step('Bypass registration restrictions'), step('Bypass payment restrictions'),
        step('Bypass password reset restrictions'), step('Race conditions'), step('Username enumeration'),
      ]),
      group('Public repos & OSINT', [
        step('Internal source code on public GitHub'), step('Privileged creds on public GitHub'), step('Internal source code in web scraping'), step('Privileged creds in web scraping'),
      ]),
    ]} />
  );
}

export function Chaining({ thisFqdn }) {
  return (
    <Methodology section="chaining" title="Chaining" description="Combine lower-impact findings into a higher-impact chain." thisFqdn={thisFqdn} groups={[
      group('Reflected input', [step('XSS + CORS bypass'), step('XSS + session riding')]),
      group('Open redirect', [step('Different paths'), step('Different subdomains'), step('Different FQDN')]),
    ]} />
  );
}

export function Resources({ thisFqdn }) {
  return (
    <Methodology section="resources" title="Resources" description="Learning material and references." thisFqdn={thisFqdn} groups={[
      group('Red team AppSec', [step('PortSwigger', Portswigger), step('HackTricks'), step('PentesterLab'), step('Hack The Box'), step('PayloadsAllTheThings'), step('Bug bounty programs')]),
      group('Blue team AppSec', [step('OWASP Cheat Sheets'), step('Codecademy')]),
    ]} />
  );
}
