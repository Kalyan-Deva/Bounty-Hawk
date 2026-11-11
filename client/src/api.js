// Every HTTP call in the client goes through these two axios instances.
//
// The browser only talks to the Vite dev server, which proxies:
//   /api/*      -> Express API     (BH_SERVER_URL,  default http://127.0.0.1:8000)
//   /toolkit/*  -> Flask toolkit   (BH_TOOLKIT_URL, default http://127.0.0.1:5000)
//
// `npm run dev:mock` sets VITE_MOCK=1, which swaps both instances onto an
// in-browser adapter with sample data so the UI runs without MongoDB.

import axios from 'axios'
import { mockAdapter } from './mock'

export const MOCK_MODE = import.meta.env.VITE_MOCK === '1'

/** Every route in server/routes/Routes.js and toolkit/toolkit-service.py. */
export const ENDPOINTS = {
  server: [
    ['GET', '/api/ping', 'Health check'],
    ['POST', '/api/fqdn/all', 'List targets'],
    ['POST', '/api/fqdn', 'Get target by _id'],
    ['POST', '/api/fqdn/new', 'Create target'],
    ['POST', '/api/fqdn/update', 'Update target by _id'],
    ['POST', '/api/fqdn/delete', 'Delete target by _id'],
    ['POST', '/api/auto', 'Get target by fqdn'],
    ['POST', '/api/auto/update', 'Update target by fqdn'],
    ['POST', '/api/url/all', 'List URLs'],
    ['POST', '/api/url', 'Get URL by _id'],
    ['POST', '/api/url/new', 'Create URL'],
    ['POST', '/api/url/update', 'Update URL by _id'],
    ['POST', '/api/url/delete', 'Delete URL by _id'],
    ['POST', '/api/url/auto', 'Get URL by url'],
    ['POST', '/api/url/auto/update', 'Update URL by url'],
    ['POST', '/api/url/auto/delete', 'Delete URL by url'],
    ['POST', '/api/cve/all', 'List CVEs'],
    ['POST', '/api/cve/new', 'Create CVE'],
    ['POST', '/api/cve/delete', 'Delete CVE'],
    ['POST', '/api/log/all', 'List scan logs'],
    ['POST', '/api/log/new', 'Create scan log'],
    ['POST', '/api/log/delete', 'Delete all scan logs'],
    ['POST', '/api/populate-burp', 'Burp: crawl & audit URL list'],
    ['POST', '/api/scan/default', 'Burp: default scan'],
    ['POST', '/api/scan/deep', 'Burp: deep scan'],
  ],
  toolkit: [
    ['GET', '/ping', 'Health check'],
    ['GET', '/status', 'Current scan status'],
    ['POST', '/wildfire', 'Start Wildfire'],
    ['GET', '/terminate-subprocesses', 'Stop running scan'],
    ['POST', '/collect_sceenshots', 'Collect screenshots'],
  ],
}

const serverURL = import.meta.env.VITE_SERVER_API_URL || ''
const toolkitURL = import.meta.env.VITE_TOOLKIT_API_URL || '/toolkit'

export const api = axios.create({ baseURL: serverURL, timeout: 20000 })
export const toolkit = axios.create({ baseURL: toolkitURL })

if (MOCK_MODE) {
  api.defaults.adapter = mockAdapter('server')
  toolkit.defaults.adapter = mockAdapter('toolkit')
}

/** Strict domain check. The toolkit passes the FQDN to a shell, so nothing else may reach it. */
export const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

export function normalizeDomain(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
}

/** The Burp controllers never respond; treat a short timeout as "handed off". */
export async function handOff(path, body) {
  try {
    await api.post(path, body, { timeout: 4000 })
  } catch (error) {
    if (error.code !== 'ECONNABORTED') throw error
  }
}

export const errorText = (error, fallback = 'Request failed') =>
  error?.response?.data?.error || error?.response?.data?.message || (error?.response ? `${fallback} (HTTP ${error.response.status})` : error?.code === 'ECONNABORTED' ? `${fallback}: timed out` : error?.message ? `${fallback}: ${error.message}` : fallback)
