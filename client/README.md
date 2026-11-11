# Bounty Hawk client

React 18 + Vite. Talks to the Express API (`../server`) and the Flask toolkit (`../toolkit`).

## Run

Start MongoDB, `node server/server.js` and `python3 toolkit/toolkit-service.py` (or `./run.sh`), then:

```bash
npm install
npm start          # http://127.0.0.1:3000
```

To try the UI without any services, run it on sample data. Everything stays in the browser:

```bash
npm run dev:mock
```

## How requests reach the services

All calls go through `src/api.js` (`api` for Express, `toolkit` for Flask). The browser only talks to the Vite dev server, which proxies:

```text
/api/*      ->  BH_SERVER_URL   (default http://127.0.0.1:8000)
/toolkit/*  ->  BH_TOOLKIT_URL  (default http://127.0.0.1:5000)
```

Copy `.env.example` to `.env` to change them. Settings → API map lists every route.

## Layout

| Section | What it is |
|---|---|
| Dashboard | Counts, impactful Nuclei findings, subdomain sources, hosts, ASN → netblock → IP map, cloud, DNS, IPs |
| Recon, CVE & Nuclei, Infrastructure, Core, Creative, Chaining, Resources | Methodology checklists defined in `src/Components/sections.jsx`. Steps without a guide show as *planned*. |
| Enumeration | Live URLs with screenshots and DNS; Burp populate / default / deep scan |
| Logs | Scan logs stored by the toolkit |
| Settings | Targets, JSON export/import, screenshot collection, service tests, API map |

Tool guides live in `src/Components/SubComponents`. To add one, write the component and set it as `component` on its step in `sections.jsx`.

The Burp routes never send a response, so the client waits 4 s and treats a timeout as "handed off". The toolkit passes the FQDN to a shell, so the UI only sends plain domains.

## Security defaults

- The Express API (`server/server.js`) and the toolkit (`toolkit/toolkit-service.py`) listen on `127.0.0.1` only. Set `BH_HOST` / `BH_TOOLKIT_HOST` to change that deliberately.
- Both reject browser requests from origins other than the client (`http://127.0.0.1:3000`, `http://localhost:3000`, and port 4173 for `vite preview`), so another web page can't start scans or delete data. Requests with no `Origin` header (the toolkit's Python calls, curl) are allowed. If you serve the client somewhere else, list it in `BH_ALLOWED_ORIGINS` (comma-separated) for both services.
- The toolkit's Flask debugger is off. `BH_TOOLKIT_DEBUG=1` turns it on.
- Target names must be plain domains. The server model and routes enforce it, and the toolkit runs `wildfire.py` without a shell.

