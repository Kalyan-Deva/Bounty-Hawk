import React, { useMemo, useState } from "react";
import Icon from "./Icon";

function flattenGroups(groups) {
  return groups.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label }))
  );
}

export function MethodologyPlaceholder({ title, description, target }) {
  return (
    <div className="ui3-placeholder">
      <span className="ui3-placeholder-icon">
        <Icon name="creative" size={28} />
      </span>
      <span className="ui3-eyebrow">Methodology workspace</span>
      <h3>{title}</h3>
      <p>
        {description ||
          "This workflow is preserved from the original methodology and is ready for its implementation or notes."}
      </p>
      <div className="ui3-placeholder-facts">
        <div>
          <small>Target</small>
          <strong>{target || "No target selected"}</strong>
        </div>
        <div>
          <small>Status</small>
          <strong>Ready for implementation</strong>
        </div>
      </div>
    </div>
  );
}

function WorkspaceLayout({
  eyebrow,
  title,
  description,
  target,
  groups,
  currentStep,
  onSelect,
  children,
  countLabel = "workflows",
}) {
  const [query, setQuery] = useState("");
  const allItems = useMemo(() => flattenGroups(groups), [groups]);
  const activeItem =
    allItems.find((item) => item.step === currentStep) || allItems[0];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.label} ${item.description || ""}`
            .toLowerCase()
            .includes(normalizedQuery)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, normalizedQuery]);

  return (
    <section className="ui3-workspace-page">
      <header className="ui3-page-hero">
        <div className="ui3-page-hero-copy">
          <span className="ui3-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="ui3-page-summary">
          <div>
            <small>Active target</small>
            <strong>{target || "No target selected"}</strong>
          </div>
          <div>
            <small>Coverage</small>
            <strong>
              {allItems.length} {countLabel}
            </strong>
          </div>
        </div>
      </header>

      <div className="ui3-workspace-grid">
        <aside className="ui3-workspace-nav">
          <div className="ui3-workspace-nav-header">
            <div>
              <span className="ui3-eyebrow">Workflow navigator</span>
              <h2>Testing modules</h2>
            </div>
            <span className="ui3-count-badge">{allItems.length}</span>
          </div>

          <label className="ui3-search-field">
            <Icon name="recon" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workflows"
            />
          </label>

          <div className="ui3-workspace-nav-scroll">
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <div className="ui3-workspace-nav-group" key={group.label}>
                  <p>{group.label}</p>
                  {group.items.map((item) => (
                    <button
                      type="button"
                      key={`${group.label}-${item.step}-${item.label}`}
                      className={`ui3-workspace-nav-item ${
                        currentStep === item.step ? "is-active" : ""
                      }`}
                      onClick={() => onSelect(item.step)}
                    >
                      <span className="ui3-workspace-nav-dot" />
                      <span>
                        <strong>{item.label}</strong>
                        {item.description && <small>{item.description}</small>}
                      </span>
                      <Icon name="chevron" size={15} />
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="ui3-nav-empty">No matching workflow found.</div>
            )}
          </div>
        </aside>

        <main className="ui3-workspace-stage">
          <header className="ui3-workspace-stage-header">
            <div>
              <span className="ui3-eyebrow">
                {activeItem?.group || eyebrow}
              </span>
              <h2>{activeItem?.label || title}</h2>
              <p>
                {activeItem?.description ||
                  "Review the selected workflow and its saved evidence."}
              </p>
            </div>
            <span className="ui3-stage-status">
              <span /> Ready
            </span>
          </header>

          <div className="ui3-workspace-stage-body">{children}</div>
        </main>
      </div>
    </section>
  );
}

export default WorkspaceLayout;
