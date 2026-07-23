# Bounty Hawk — Project Functionality and Development Plan

## 1. Project Purpose

Bounty Hawk is a local-first attack-surface management and authorized security-testing platform.

Its purpose is to bring the complete bug-bounty and penetration-testing workflow into one application:

1. Add an authorized target.
2. Define and validate scope.
3. Run reconnaissance and enumeration modules.
4. Review live assets and discovered endpoints.
5. Perform vulnerability and manual testing.
6. Connect related weaknesses into attack chains.
7. Store evidence and activity logs.
8. Generate a professional security report.

Bounty Hawk is not intended to blindly scan arbitrary public systems. Every live scan should be restricted to domains that the user owns or is explicitly authorized to test.

---

## 2. Current Architecture

Bounty Hawk currently uses four primary services.

| Service | Technology | Default Port | Purpose |
|---|---|---:|---|
| Frontend | React | 3000 | Dashboard, target management, scan controls, results, reporting |
| Main API | Express / Node.js | 8000 | MongoDB access, target data, findings, logs, application APIs |
| Scanner API | Flask / Python | 5000 | Scan validation, process execution, background jobs, scanner health |
| Database | MongoDB | 27017 | Persistent targets, findings, logs, scan data, application state |

Optional integrations can include Burp Suite, external reconnaissance utilities, screenshots, Nuclei, Amass, Subfinder, Assetfinder, GAU, ShuffleDNS, and other authorized testing tools.

### Request flow

```text
React frontend
    |
    |-- application data --------------------> Express API --> MongoDB
    |
    |-- scanner commands --------------------> Flask API
                                                   |
                                                   |-- Wildfire orchestrator
                                                   |-- Fire Starter
                                                   |-- Additional scanner modules
                                                   |-- External tools
```

---

## 3. Core Application Areas

## 3.1 Target and Scope Management

### What it does

The target workspace allows the user to add a domain or fully qualified domain name, select it as the active workspace, import scope data, and delete or restore target information.

Example target:

```text
bounty-hawk.test
```

### Why it exists

Every scan, finding, endpoint, screenshot, log entry, and report must belong to a specific authorized target. Without a central target workspace, results become difficult to organize and scope mistakes become more likely.

### Expected functionality

- Add a domain or FQDN.
- Validate domain syntax.
- Confirm that the target is in the scanner allowlist.
- Select one active target.
- Import Burp scope data.
- Export or restore a Bounty Hawk workspace.
- Delete a target only after confirmation.
- Keep findings separated by target.

### Security rule

The domain stored in the workspace and the domain present in `authorized-scopes.json` must match before a live scan can begin.

---

## 3.2 Overview Dashboard

### What it does

The Overview page summarizes the current target and the most important testing data.

### Why it exists

A security tester should be able to understand the current state of a target without opening every module individually.

### Expected information

- Active target.
- Scan profile.
- Last scan status.
- Live hosts and URLs.
- Discovered subdomains.
- Open ports.
- Vulnerability counts by severity.
- Recent findings.
- Infrastructure records.
- DNS records.
- Cloud assets.
- Background job status.

### Current state

The interface has been modernized with a consistent dark design, Poppins typography, responsive layouts, and larger readable text.

---

## 3.3 Reconnaissance

### What it does

Reconnaissance collects public and target-related information before deeper testing begins.

### Why it exists

Good vulnerability research starts with understanding the target's public footprint. Reconnaissance identifies systems, technologies, repositories, archived content, and information that may expand the authorized attack surface.

### Planned and existing capabilities

- Domain intelligence.
- Public subdomain discovery.
- Archived URL collection.
- GitHub and source-code searches.
- Certificate Transparency lookups.
- Public cloud-asset identification.
- Technology and service fingerprints.
- Public metadata collection.

### Output

Recon results should be normalized into reusable assets rather than remaining only as raw command output.

---

## 3.4 Enumeration

### What it does

Enumeration converts the broad recon data into specific, testable assets.

### Why it exists

Recon may produce hundreds or thousands of records. Enumeration determines which hosts are alive, what services they expose, and which URLs or endpoints deserve manual testing.

### Expected capabilities

- Subdomain enumeration.
- DNS resolution.
- HTTP and HTTPS probing.
- Port and service discovery.
- Endpoint extraction.
- URL crawling.
- Screenshot collection.
- Burp Suite integration.
- Filtering and deduplication.

### Expected result format

```json
{
  "target": "bounty-hawk.test",
  "hostname": "bounty-hawk.test",
  "url": "http://bounty-hawk.test:8001",
  "ip": "127.0.0.1",
  "ports": [8001],
  "status": "live"
}
```

---

## 3.5 CVE Testing

### What it does

The CVE Testing area displays automated vulnerability-template results and known-vulnerability checks.

### Why it exists

Known vulnerabilities are only one part of security testing, but they provide fast validation of outdated software, exposed administrative services, and common misconfigurations.

### Expected capabilities

- Run selected Nuclei templates.
- Group findings by severity.
- Display template ID and matched URL.
- Store evidence and request information.
- Mark findings as reviewed, false positive, duplicate, or valid.
- Link a CVE result to a manual-testing note.

### Important rule

Automated matches are leads, not automatically valid vulnerabilities. Findings must be manually verified before reporting.

---

## 3.6 Operations Testing

### What it does

Operations Testing covers practical application and infrastructure checks that do not belong only to one CVE.

### Why it exists

Many important security issues are caused by deployment mistakes, access-control failures, unsafe operational behavior, or insecure configuration rather than a published CVE.

### Example testing areas

- Authentication behavior.
- Session management.
- Access control.
- File exposure.
- Debug and administrative interfaces.
- HTTP security headers.
- TLS configuration.
- Cloud-storage permissions.
- Backup and artifact exposure.
- Secrets and environment-file exposure.

---

## 3.7 Core Testing

### What it does

Core Testing contains the main web-application security methodology.

### Why it exists

A repeatable checklist reduces missed test cases and provides structure for manual investigation.

### Expected categories

- Authentication.
- Authorization.
- Input validation.
- Injection.
- Cross-site scripting.
- Server-side request forgery.
- File upload.
- Path traversal.
- Business logic.
- API security.
- Rate limiting.
- Cryptography and sensitive-data handling.

### Expected workflow

Each test should support:

- Status: not started, testing, passed, failed, not applicable.
- Notes.
- Evidence.
- Related endpoint.
- Related finding.
- Retest state.

---

## 3.8 Creative Testing

### What it does

Creative Testing is used for hypotheses and non-standard attack ideas that do not fit a fixed checklist.

### Why it exists

The highest-value findings are often discovered by understanding how multiple features interact rather than by running a known template.

### Example uses

- Testing unusual state transitions.
- Combining mobile, API, and web behavior.
- Exploring undocumented workflows.
- Investigating role changes.
- Testing race conditions.
- Reviewing trust boundaries.
- Recording custom attack hypotheses.

---

## 3.9 Chaining

### What it does

Chaining connects multiple low- or medium-impact weaknesses into one complete attack path.

### Why it exists

One issue may appear minor by itself but become critical when combined with another weakness.

### Example chain

```text
Public endpoint disclosure
    -> weak authorization
    -> access to another user's object
    -> sensitive account data exposure
```

### Expected capabilities

- Select existing findings.
- Define the sequence of steps.
- Explain prerequisites.
- Calculate combined impact.
- Store the final proof of concept.
- Export the chain into the final report.

---

## 3.10 Resources

### What it does

Resources stores target-specific reference material.

### Why it exists

During testing, the user may need to keep program rules, documentation, credentials for a lab account, API references, wordlists, useful URLs, and notes in one location.

### Expected content

- Program scope page.
- API documentation.
- Test credentials.
- Important endpoints.
- Public references.
- Wordlists.
- Reproduction notes.
- Contact and disclosure information.

Sensitive values should not be committed to Git or stored as plaintext without protection.

---

## 3.11 Logging

### What it does

Logging records scanner activity and manual actions.

### Why it exists

Logs are required for troubleshooting, reproducibility, and understanding exactly what was executed against an authorized target.

### Expected capabilities

- Background-job logs.
- Module start and completion times.
- Exit codes.
- Warnings and errors.
- Recent stdout and stderr.
- Manual activity notes.
- Filter by target, module, status, and time.

---

## 3.12 Report Builder

### What it does

The Report Builder converts verified findings into a professional security report.

### Why it exists

A finding is only useful when the affected organization can clearly understand, reproduce, prioritize, and fix it.

### Expected report sections

- Executive summary.
- Scope.
- Testing methodology.
- Finding title.
- Severity.
- Affected asset.
- Description.
- Preconditions.
- Reproduction steps.
- Evidence.
- Impact.
- Remediation.
- References.
- Retest status.

### Output formats

- Markdown.
- PDF.
- JSON export.
- HackerOne-style report text.

---

## 4. Scanner Architecture

## 4.1 Flask Scanner Service

### Purpose

The Flask service acts as a security boundary between the React application and operating-system commands.

### Responsibilities

- Validate request data.
- Validate target syntax.
- Confirm authorized scope.
- Build commands as argument arrays.
- Reject command-injection payloads.
- Start scans as background jobs.
- Track scan status.
- Support cancellation.
- Return health and tool-availability information.

### Important endpoints

```text
GET  /health
GET  /status
GET  /jobs
GET  /jobs/<job_id>
POST /wildfire
POST /terminate-subprocesses
```

---

## 4.2 Wildfire

### Purpose

Wildfire is the main scan orchestrator.

### Responsibilities

- Read the requested target and profile.
- Determine which child scanner modules should run.
- Execute modules in the correct order.
- Collect structured child results.
- Aggregate warnings and errors.
- Return an honest final status.

### Final statuses

```text
completed
completed_with_warnings
failed
cancelled
```

---

## 4.3 Scanner Profiles

### Auto

Automatically chooses the correct profile based on the target.

### Local

Used for `.test`, `.invalid`, `.local`, localhost, and private laboratory systems.

Local scans should avoid public OSINT and DNS brute forcing.

Typical local modules:

- DNS resolution.
- Exact HTTP probing.
- Crawling.
- Screenshot capture.
- Selected local vulnerability checks.

### Standard

Used for normal authorized public-domain testing.

Typical modules:

- Passive subdomain discovery.
- HTTP probing.
- URL discovery.
- Crawling.
- Screenshots.
- Selected vulnerability templates.

### Deep

Used only when broader, slower, and more intrusive discovery has been explicitly approved.

Typical additions:

- DNS permutation and brute forcing.
- Broader service discovery.
- Additional enumeration tools.
- Larger template sets.

---

## 4.4 Tool Health

The `/health` endpoint currently detects major installed tools such as:

- Amass.
- Assetfinder.
- GAU.
- Nuclei.
- ShuffleDNS.
- Subfinder.

Tool health should eventually include:

- Installed state.
- Executable path.
- Version.
- Compatibility state.
- Missing configuration.
- Recommended update action.

---

## 5. Background Jobs

### Current behavior

A scan request returns immediately with a job ID. The scanner continues in a background process.

Example:

```json
{
  "message": "Scan queued",
  "job_id": "38dcfb86-d26d-4519-9726-68395b3d6b8e",
  "status": "queued",
  "target": "bounty-hawk.test"
}
```

### Job lifecycle

```text
queued -> running -> completed
                 -> completed_with_warnings
                 -> failed
                 -> cancelled
```

### Current limitation

Jobs are held in Flask memory. Restarting Flask removes the in-memory job history.

### Future requirement

Persist jobs in MongoDB so that:

- Scan history survives restarts.
- The frontend can recover old jobs.
- Logs remain available.
- Reports can reference a specific scan.

---

## 6. Current Working State

The following functionality has been confirmed working:

- React frontend starts successfully.
- Express API starts successfully.
- MongoDB runs locally in a Docker container.
- Target CRUD works.
- Flask toolkit health endpoint works.
- Authorized scope validation works.
- Command-injection attempts are rejected.
- Dry-run command previews work.
- Background jobs work.
- Job polling works.
- Scan cancellation endpoint exists.
- Scanner profiles are available.
- Tool availability is reported.
- A local scan against `bounty-hawk.test` completed successfully.
- DNS, HTTP probing, crawling, and screenshots completed.
- Structured scanner results were generated.
- The frontend has been redesigned with a consistent responsive UI.

---

## 7. Known Issues and Limitations

### 7.1 In-memory jobs

Restarting Flask removes current job records.

### 7.2 Result normalization

Some existing database fields contain mixed value types, such as strings in older records and objects in newer records. React components must normalize data before rendering.

### 7.3 Exact target isolation

When a hostname resolves to `127.0.0.1`, a broad local port probe may discover Bounty Hawk's own services. When an exact target URL is supplied, the scanner should default to scanning only that URL and port.

### 7.4 Legacy tools

Some integrated tools use old command-line formats or old Python dependencies. Every tool needs a compatibility adapter and independent health status.

### 7.5 Live logs

The current job implementation may store complete stdout and stderr after the process exits instead of streaming all output live.

### 7.6 Finding verification

Automated findings still require manual validation and lifecycle states.

### 7.7 Secrets

Environment files, tokens, API keys, and private credentials must never be exposed through a test web server or committed to Git.

---

## 8. Development Roadmap

## Phase 1 — Foundation and Safety

Status: mostly completed.

- [x] Run MongoDB locally.
- [x] Restore Express and React.
- [x] Secure Flask command execution.
- [x] Add target allowlisting.
- [x] Add dry-run validation.
- [x] Add background jobs.
- [x] Add cancellation.
- [x] Add local scanner profile.
- [x] Add structured scanner results.
- [x] Modernize the frontend.

---

## Phase 2 — Reliable Scanner Engine

- [ ] Persist scan jobs in MongoDB.
- [ ] Stream live scanner output.
- [ ] Isolate exact target URL and port by default.
- [ ] Add per-tool compatibility adapters.
- [ ] Add timeouts per module.
- [ ] Add retry policy for temporary failures.
- [ ] Add module-level cancellation.
- [ ] Add scan resource limits.
- [ ] Add clear `completed_with_warnings` handling everywhere.

---

## Phase 3 — Unified Asset Model

- [ ] Normalize domains, hosts, IP addresses, ports, URLs, and services.
- [ ] Deduplicate assets.
- [ ] Record which module discovered each asset.
- [ ] Store first-seen and last-seen timestamps.
- [ ] Add asset confidence and status.
- [ ] Track changes between scans.

Proposed asset structure:

```json
{
  "targetId": "...",
  "type": "url",
  "value": "https://api.example.com/v1/users",
  "hostname": "api.example.com",
  "ipAddresses": ["203.0.113.10"],
  "ports": [443],
  "sources": ["subfinder", "http_probe"],
  "firstSeen": "...",
  "lastSeen": "...",
  "status": "live"
}
```

---

## Phase 4 — Unified Finding Model

- [ ] Store automated and manual findings in one collection.
- [ ] Add severity and confidence.
- [ ] Add evidence.
- [ ] Add reproduction steps.
- [ ] Add remediation.
- [ ] Add review states.
- [ ] Add duplicate detection.
- [ ] Link findings to assets and scan jobs.

Proposed finding states:

```text
new
reviewing
needs_verification
valid
false_positive
duplicate
reported
resolved
retest_required
closed
```

---

## Phase 5 — Manual Testing Workflow

- [ ] Make each methodology item stateful.
- [ ] Add notes and evidence attachments.
- [ ] Link tests to endpoints.
- [ ] Add custom test cases.
- [ ] Add retesting.
- [ ] Add collaboration-ready activity history.

---

## Phase 6 — Reporting

- [ ] Build a reusable finding template.
- [ ] Generate Markdown reports.
- [ ] Generate PDF reports.
- [ ] Generate HackerOne-ready reports.
- [ ] Include screenshots and evidence.
- [ ] Include attack chains.
- [ ] Add redaction controls.

---

## Phase 7 — Packaging and Deployment

- [ ] Add a root `docker-compose.yml`.
- [ ] Start MongoDB, Express, Flask, and React together.
- [ ] Add a single local startup command.
- [ ] Add environment validation.
- [ ] Add production build configuration.
- [ ] Add automated migrations.
- [ ] Add CI tests.
- [ ] Add release documentation.

Target command:

```bash
./start-local.sh
```

or:

```bash
docker compose up
```

---

## 9. Security Design Principles

1. Only test assets that are explicitly authorized.
2. Require scope validation before live execution.
3. Never construct target-controlled shell strings.
4. Use argument arrays for subprocess execution.
5. Bind development services to localhost unless external access is required.
6. Do not expose project directories through temporary web servers.
7. Never commit `.env`, tokens, cookies, credentials, or private scan data.
8. Store enough logs to reproduce actions.
9. Clearly distinguish automated leads from verified vulnerabilities.
10. Keep aggressive scanning behind an explicit profile and confirmation step.

---

## 10. Local Development Commands

### MongoDB

```bash
sudo systemctl start docker

docker start bounty-hawk-mongo
```

### Express API

```bash
cd ~/Scripts/Bounty-Hawk/server
npm start
```

### Flask toolkit

```bash
cd ~/Scripts/Bounty-Hawk/toolkit
source .venv/bin/activate
python toolkit-service.py
```

### React frontend

```bash
cd ~/Scripts/Bounty-Hawk/client
npm start
```

### Safe local test website

```bash
cd ~/bounty-hawk-test-site
python3 -m http.server 8001 --bind 127.0.0.1
```

### Health checks

```bash
curl -s http://127.0.0.1:5000/health | python3 -m json.tool
```

```bash
curl -s -X POST http://127.0.0.1:8000/api/fqdn/all \
  -H 'Content-Type: application/json' \
  -d '{}' | python3 -m json.tool
```

---

## 11. Current Pause Point

Development is paused after the following milestones:

- Frontend redesign completed.
- Scanner Core v1 installed.
- Local scanner profile tested successfully.
- Background scan completed without warnings.
- React job recovery added.
- Infrastructure-object rendering error fixed.

The next engineering discussion should focus on the complete product functionality and data flow before adding more code.

The recommended next decision is to define the permanent data models for:

1. Target.
2. Asset.
3. Scan job.
4. Module result.
5. Finding.
6. Manual test.
7. Attack chain.
8. Report.
9. Resource.
10. Activity log.

Once these models are agreed upon, the implementation can continue without repeated frontend and backend restructuring.

---

## 12. Definition of a Complete Bounty Hawk v1

Bounty Hawk v1 will be considered complete when a user can:

1. Add an authorized target.
2. Validate its scope.
3. Select an appropriate scan profile.
4. Start, monitor, cancel, and revisit a scan.
5. View normalized assets.
6. Review automated findings.
7. Perform structured manual testing.
8. Create attack chains.
9. Store evidence and logs.
10. Generate a professional report.
11. Restart the application without losing scan history.
12. Start the full platform using one documented command.

