import React, { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

function normalizeSeverity(value) {
  const severity = String(value || "unknown").toLowerCase();
  return Object.prototype.hasOwnProperty.call(SEVERITY_ORDER, severity)
    ? severity
    : "unknown";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function CopyValue({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className="ui3-copy-button" type="button" onClick={copy}>
      <Icon name="report" size={15} />
      {copied ? "Copied" : label}
    </button>
  );
}

function DetailRow({ label, children, mono = false }) {
  return (
    <div className="ui3-finding-detail-row">
      <small>{label}</small>
      <div className={mono ? "is-mono" : ""}>{children || "—"}</div>
    </div>
  );
}

function NucleiResultsView({ document, field, label }) {
  const findings = useMemo(
    () =>
      safeArray(document?.[field])
        .filter((finding) => finding?.info?.severity !== "foo")
        .slice()
        .sort((left, right) => {
          const severityDifference =
            SEVERITY_ORDER[normalizeSeverity(left?.info?.severity)] -
            SEVERITY_ORDER[normalizeSeverity(right?.info?.severity)];
          if (severityDifference !== 0) return severityDifference;
          return String(left?.info?.name || "").localeCompare(
            String(right?.info?.name || "")
          );
        }),
    [document, field]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [field]);

  const selected = findings[selectedIndex] || null;

  if (findings.length === 0) {
    return (
      <div className="ui3-placeholder ui3-placeholder-compact">
        <span className="ui3-placeholder-icon">
          <Icon name="shield" size={28} />
        </span>
        <span className="ui3-eyebrow">No saved findings</span>
        <h3>{label}</h3>
        <p>
          This category has no normalized findings for the selected target yet.
        </p>
      </div>
    );
  }

  const severity = normalizeSeverity(selected?.info?.severity);
  const tags = safeArray(selected?.info?.tags);
  const references = safeArray(selected?.info?.reference);
  const extracted = safeArray(selected?.["extracted-results"]);
  const matchedAt = selected?.["matched-at"];
  const curlCommand = selected?.["curl-command"];

  return (
    <div className="ui3-findings-layout">
      <aside className="ui3-findings-list">
        <div className="ui3-findings-list-header">
          <div>
            <span className="ui3-eyebrow">Captured evidence</span>
            <h3>{findings.length} findings</h3>
          </div>
        </div>
        <div className="ui3-findings-list-scroll">
          {findings.map((finding, index) => {
            const itemSeverity = normalizeSeverity(finding?.info?.severity);
            return (
              <button
                type="button"
                key={`${finding?.["template-id"] || "finding"}-${index}`}
                className={`ui3-finding-list-item ${
                  selectedIndex === index ? "is-active" : ""
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className={`ui3-severity-dot is-${itemSeverity}`} />
                <span>
                  <strong>{finding?.info?.name || "Unnamed finding"}</strong>
                  <small>{finding?.["template-id"] || "No template ID"}</small>
                </span>
                <span className={`ui3-severity-pill is-${itemSeverity}`}>
                  {itemSeverity}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <article className="ui3-finding-detail">
        <header className="ui3-finding-detail-header">
          <div>
            <span className={`ui3-severity-pill is-${severity}`}>
              {severity}
            </span>
            <h3>{selected?.info?.name || "Unnamed finding"}</h3>
            <p>{selected?.info?.description || "No description was provided."}</p>
          </div>
          {matchedAt && <CopyValue value={matchedAt} label="Copy match" />}
        </header>

        <div className="ui3-finding-detail-grid">
          <DetailRow label="Template ID" mono>
            {selected?.["template-id"]}
          </DetailRow>
          <DetailRow label="Matcher" mono>
            {selected?.["matcher-name"]}
          </DetailRow>
          <DetailRow label="Host" mono>
            {selected?.host ? (
              <a
                href={String(selected.host).startsWith("http") ? selected.host : `http://${selected.host}`}
                target="_blank"
                rel="noreferrer"
              >
                {selected.host}
              </a>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="IP address" mono>
            {selected?.ip}
          </DetailRow>
          <DetailRow label="Matched location" mono>
            {matchedAt ? (
              <a href={matchedAt} target="_blank" rel="noreferrer">
                {matchedAt}
              </a>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Discovered" mono>
            {selected?.timestamp}
          </DetailRow>
        </div>

        {tags.length > 0 && (
          <section className="ui3-finding-section">
            <h4>Tags</h4>
            <div className="ui3-tag-list">
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`}>{tag}</span>
              ))}
            </div>
          </section>
        )}

        {extracted.length > 0 && (
          <section className="ui3-finding-section">
            <h4>Extracted results</h4>
            <div className="ui3-code-list">
              {extracted.map((result, index) => (
                <code key={`${result}-${index}`}>{result}</code>
              ))}
            </div>
          </section>
        )}

        {references.length > 0 && (
          <section className="ui3-finding-section">
            <h4>References</h4>
            <div className="ui3-link-list">
              {references.map((reference, index) => (
                <a
                  key={`${reference}-${index}`}
                  href={reference}
                  target="_blank"
                  rel="noreferrer"
                >
                  {reference}
                </a>
              ))}
            </div>
          </section>
        )}

        {curlCommand && (
          <section className="ui3-finding-section">
            <div className="ui3-section-heading-row">
              <h4>Reproduction command</h4>
              <CopyValue value={curlCommand} />
            </div>
            <pre className="ui3-code-block">{curlCommand}</pre>
          </section>
        )}
      </article>
    </div>
  );
}

export default NucleiResultsView;
